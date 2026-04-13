// screens/WebMap.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import api from "../lib/api";
import axios from "axios";
import { MarkerImages, getMarkerImageBySeverity } from "./MapIcon";
import useJaenPlaceSearch from "./hooks/useJaenPlaceSearch";

/* ------------------------- JAEN, NUEVA ECIJA LOCK ------------------------- */
const JAEN_CENTER = { latitude: 15.3274, longitude: 120.9190 };
const JAEN_PAD_LAT = 0.05;
const JAEN_PAD_LNG = 0.05;

const JAEN_BOUNDS = {
  north: JAEN_CENTER.latitude + JAEN_PAD_LAT,
  south: JAEN_CENTER.latitude - JAEN_PAD_LAT,
  west: JAEN_CENTER.longitude - JAEN_PAD_LNG,
  east: JAEN_CENTER.longitude + JAEN_PAD_LNG,
};

function isInsideBounds(lat, lng) {
  return (
    lat <= JAEN_BOUNDS.north &&
    lat >= JAEN_BOUNDS.south &&
    lng >= JAEN_BOUNDS.west &&
    lng <= JAEN_BOUNDS.east
  );
}

function clampToBounds(lat, lng) {
  return {
    latitude: Math.max(JAEN_BOUNDS.south, Math.min(JAEN_BOUNDS.north, lat)),
    longitude: Math.max(JAEN_BOUNDS.west, Math.min(JAEN_BOUNDS.east, lng)),
  };
}

/* ------------------------- Zoom helpers --------------------------- */
function zoomToLatDelta(z) {
  return 0.02 * Math.pow(2, 15 - z);
}

function markerSizeFromDelta(latDelta) {
  const MIN = 108;
  const MAX = 800;
  const REF = 0.02;
  const factor = REF / Math.max(latDelta, 1e-6);
  return Math.max(MIN, Math.min(MAX, MAX * factor));
}

export default function WebMap({ onSelect, selected, selectedLevel, userLocation }) {
  const mapRef = useRef(null);
  const { width, height } = Dimensions.get("window");
  const aspect = width / height;

  const { suggestions, search, clear } = useJaenPlaceSearch();
  const [incidents, setIncidents] = useState([]);

  const [region, setRegion] = useState(() => {
    const z = 15;
    const latDelta = zoomToLatDelta(z);
    return {
      latitude: JAEN_CENTER.latitude,
      longitude: JAEN_CENTER.longitude,
      latitudeDelta: latDelta,
      longitudeDelta: latDelta * aspect,
    };
  });

  const markerPx = markerSizeFromDelta(region.latitudeDelta);

  /* ---------------- Fetch incidents ---------------- */
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.get("/incident/getIncidents");
        setIncidents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Fetch incidents error:", err?.message);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------- Map helpers ---------------- */
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: { lat, lon: lng, format: "json" },
        headers: { "User-Agent": "SafeJaen/1.0 (contact: admin@jaen.gov.ph)" },
      });

      const a = res?.data?.address || {};
      return (
        a.road ||
        a.suburb ||
        a.neighbourhood ||
        res?.data?.display_name ||
        `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
      );
    } catch {
      return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    }
  };

  const focusTo = (lat, lng, zoom = 17, ms = 280) => {
    if (!mapRef.current) return;
    const latDelta = zoomToLatDelta(zoom);
    mapRef.current.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: latDelta,
        longitudeDelta: latDelta * aspect,
      },
      ms
    );
  };

  /* ✅ REQUIRED unified handler */
  const handleSelectSuggestion = (place) => {
    const inside = isInsideBounds(place.latitude, place.longitude);
    const target = inside
      ? { latitude: place.latitude, longitude: place.longitude }
      : clampToBounds(place.latitude, place.longitude);

    onSelect?.({
      text: place.label,
      lat: target.latitude,
      lng: target.longitude,
    });

    focusTo(target.latitude, target.longitude, 17, 300);
    clear();
  };

  /* ---------------- Marker bounce ---------------- */
  const dropScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (selected?.lat && selected?.lng) {
      dropScale.setValue(0.01);
      Animated.spring(dropScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }).start();
    }
  }, [selected?.lat, selected?.lng]);

  const selectionImg = MarkerImages.def || MarkerImages.default;

  return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          onPress={async (e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;

            const inside = isInsideBounds(latitude, longitude);
            const target = inside
              ? { latitude, longitude }
              : clampToBounds(latitude, longitude);

            const label = await reverseGeocode(
              target.latitude,
              target.longitude
            );

            onSelect?.({
              text: label,
              lat: target.latitude,
              lng: target.longitude,
            });

            focusTo(target.latitude, target.longitude, 17, 280);
          }}
        >
          {/* Incident markers */}
          {incidents.map((incident) => {
            const lat = incident?.latitude;
            const lng = incident?.longitude;
            if (!isInsideBounds(lat, lng)) return null;

            const img = getMarkerImageBySeverity(
              incident.level || incident.type
            );

            return (
              <Marker
                key={incident._id}
                coordinate={{ latitude: lat, longitude: lng }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <Image
                  source={img || MarkerImages.default}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.title}>
                      {(incident.type || "").toUpperCase()}
                    </Text>
                    <Text>Status: {incident.status ?? "—"}</Text>
                    <Text>Severity: {incident.level ?? "—"}</Text>
                    {!!incident.location && (
                      <Text>{incident.location}</Text>
                    )}
                    {!!incident.description && (
                      <Text>{incident.description}</Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}

          {/* Selected marker */}
          {!!selected?.lat && !!selected?.lng && (
            <Marker
              coordinate={{
                latitude: selected.lat,
                longitude: selected.lng,
              }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <Animated.Image
                source={selectionImg}
                style={{
                  width: markerPx,
                  height: markerPx,
                  transform: [{ scale: dropScale }],
                }}
                resizeMode="contain"
              />
              {!!selected?.label && (
                <Callout>
                  <View style={{ maxWidth: 240 }}>
                    <Text style={{ fontWeight: "600" }}>
                      {selected.label}
                    </Text>
                  </View>
                </Callout>
              )}
            </Marker>
          )}

          {/* User location */}
          {!!userLocation?.lat && !!userLocation?.lng && (
            <Marker
              coordinate={{
                latitude: userLocation.lat,
                longitude: userLocation.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <Image
                source={MarkerImages.def}
                style={{ width: 30, height: 30 }}
                resizeMode="contain"
              />
            </Marker>
          )}
        </MapView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  callout: { maxWidth: 260, padding: 6 },
  title: { fontWeight: "700", marginBottom: 4 },
});