import React, {
  useEffect,
  useRef,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import { useRoute, useFocusEffect } from "@react-navigation/native";

import { MapContext } from "./contexts/MapContext";
import useRouting from "./hooks/useRouting";
import GlobalRoutePanel from "./routing/GlobalRoutePanel";
import { PillMarker } from "./MapIcon";

/* =========================
   CONSTANTS
========================= */

const EDGE_PADDING = {
  top: 120,
  bottom: 420,
  left: 60,
  right: 60,
};

/* =========================
   PLACE NORMALIZER
========================= */

function normalizePlace(place) {
  if (!place || typeof place !== "object") return null;

  if (place._id && place.capacityStatus !== undefined) return place;

  if (place._id && place.barangayName) {
    return {
      ...place,
      name: place.name || place.barangayName,
      capacityStatus: "barangay",
      latitude: place.latitude,
      longitude: place.longitude,
    };
  }

  if (
    typeof place.latitude === "number" &&
    typeof place.longitude === "number"
  ) {
    return {
      _id: `search-${place.latitude}-${place.longitude}`,
      name: place.label || "Selected location",
      latitude: place.latitude,
      longitude: place.longitude,
      capacityStatus: "location",
    };
  }

  return null;
}

/* =========================
   COMPONENT
========================= */

export default function Map() {
  const mapRef = useRef(null);
  const navRoute = useRoute();
  const lastPlaceKeyRef = useRef(null);

  const {
    panelState,
    setPanelState,
    evac,
    setEvac,

    evacPlaces, // ✅ ALL evacuation centers (ADDED, nothing else touched)

    routeRequested,
    setRouteRequested,
    routes,
    setRoutes,
    setActiveRoute,
    travelMode,
    incidents = [],
  } = useContext(MapContext);

  const [showConfirm, setShowConfirm] = useState(false);

  const userPos = {
    latitude: 15.38,
    longitude: 120.91,
  };

  /* ✅ Exit navigation when Map loses focus */
  useFocusEffect(
    useCallback(() => {
      return () => {
        setPanelState("PLACE_INFO");
        setRouteRequested(false);
        setRoutes([]);
        setActiveRoute(null);
      };
    }, [setPanelState, setRouteRequested, setRoutes, setActiveRoute])
  );

  /* =========================
     INCIDENT NORMALIZATION
  ========================= */

  const normalizedIncidents = incidents
    .map((i) => {
      const lat = i.latitude ?? i.lat ?? i.location?.lat;
      const lng = i.longitude ?? i.lng ?? i.location?.lng;

      const nLat = typeof lat === "string" ? parseFloat(lat) : lat;
      const nLng = typeof lng === "string" ? parseFloat(lng) : lng;

      return { ...i, latitude: nLat, longitude: nLng };
    })
    .filter(
      (i) =>
        typeof i.latitude === "number" &&
        typeof i.longitude === "number" &&
        !Number.isNaN(i.latitude) &&
        !Number.isNaN(i.longitude)
    );

  /* =========================
     PLACE SELECTION (SEARCH)
  ========================= */

  useEffect(() => {
    const rawPlace =
      navRoute.params?.evacPlace ??
      navRoute.params?.barangay ??
      navRoute.params?.place;

    const selectedPlace = rawPlace?.raw
      ? rawPlace.raw
      : normalizePlace(rawPlace);

    if (!selectedPlace) return;

    const key = `${selectedPlace._id}-${selectedPlace.latitude}-${selectedPlace.longitude}`;
    if (lastPlaceKeyRef.current === key) return;

    lastPlaceKeyRef.current = key;

    setEvac(selectedPlace);
    setPanelState("PLACE_INFO");

    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [userPos, selectedPlace],
        { edgePadding: EDGE_PADDING, animated: true }
      );
    }

    setRouteRequested(false);
    setRoutes([]);
    setActiveRoute(null);
  }, [
    navRoute.params?.evacPlace,
    navRoute.params?.barangay,
    navRoute.params?.place,
  ]);

  /* =========================
     ROUTING
  ========================= */

  const routing = useRouting({
    enabled: routeRequested && !!evac,
    from: [userPos.latitude, userPos.longitude],
    to: evac ? { lat: evac.latitude, lng: evac.longitude } : null,
    mode: travelMode,
    incidents: normalizedIncidents,
  });

  useEffect(() => {
    if (!routeRequested || !routing.routes?.length) return;

    setRoutes(routing.routes);
    setActiveRoute(routing.routes[0]);

    if (panelState !== "NAVIGATION" && mapRef.current) {
      mapRef.current.fitToCoordinates(
        routing.routes[0].coords,
        { edgePadding: EDGE_PADDING, animated: true }
      );
    }
  }, [routing.routes, routeRequested, panelState]);

  /* =========================
     NAV CAMERA
  ========================= */

  useEffect(() => {
    if (panelState !== "NAVIGATION" || !mapRef.current) return;

    mapRef.current.animateCamera(
      { center: userPos, zoom: 18.5, pitch: 50, heading: 0 },
      { duration: 700 }
    );
  }, [panelState]);

  /* =========================
     STOP CONFIRM
  ========================= */

  const handleStopConfirmed = () => {
    setShowConfirm(false);
    setRouteRequested(false);
    setRoutes([]);
    setActiveRoute(null);
    setPanelState("PLACE_INFO");
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        showsUserLocation
      >
        {/* USER */}
        <Marker coordinate={userPos} pinColor="#2563eb" />

        {/* ✅ SEARCH‑SELECTED DESTINATION (UNCHANGED) */}
        {evac && (
          <Marker coordinate={evac}>
            <PillMarker color="#16a34a" label={evac.name} compact />
          </Marker>
        )}

        {/* ✅ ALL EVACUATION CENTERS (NEW) */}
        {evacPlaces.map((place) => (
          <Marker
            key={place._id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => {
              setEvac(place);
              setPanelState("PLACE_INFO");
              setRouteRequested(false);
            }}
          >
            <PillMarker
              color="#16a34a"
              label={place.name}
              compact
            />
          </Marker>
        ))}

        {/* INCIDENTS */}
        {normalizedIncidents.map((i) => (
          <Marker
            key={i._id}
            coordinate={{ latitude: i.latitude, longitude: i.longitude }}
          >
            <View style={styles.incidentPin}>
              <Text>⚠️</Text>
            </View>
          </Marker>
        ))}

        {/* ROUTES */}
        {routes.map((r, i) => {
          if (panelState === "NAVIGATION" && !r.isRecommended) {
            return null;
          }

          return (
            <Polyline
              key={i}
              coordinates={r.coords}
              strokeColor={r.isRecommended ? "#22c55e" : "#ef4444"}
              strokeWidth={6}
              lineDashPattern={
                !r.isRecommended && r.dangerScore > 0
                  ? [8, 6]
                  : undefined
              }
              zIndex={r.isRecommended ? 3 : 1}
            />
          );
        })}
      </MapView>

      {/* ✅ BUTTONS – UNTOUCHED */}
      {(panelState === "PLACE_INFO" ||
        panelState === "ROUTE_SELECTION" ||
        panelState === "NAVIGATION") && (
        <View style={styles.fabContainer}>
          {panelState === "PLACE_INFO" && evac && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                setPanelState("ROUTE_SELECTION");
                setRouteRequested(true);
              }}
            >
              <Text style={styles.primaryText}>View routes</Text>
            </TouchableOpacity>
          )}

          {panelState === "ROUTE_SELECTION" && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setPanelState("NAVIGATION")}
            >
              <Text style={styles.primaryText}>Go now</Text>
            </TouchableOpacity>
          )}

          {panelState === "NAVIGATION" && (
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() => setShowConfirm(true)}
            >
              <Text style={styles.dangerText}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <GlobalRoutePanel visible />

      <Modal transparent visible={showConfirm} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>
              Do you want to stop navigation?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowConfirm(false)}>
                <Text>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStopConfirmed}>
                <Text style={{ color: "red" }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  incidentPin: {
    backgroundColor: "#f59e0b",
    padding: 6,
    borderRadius: 16,
  },

  fabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 115,
    backgroundColor: "#ffffff",
    padding: 14,
    zIndex: 3000,
    elevation: 3000,
  },

  primaryBtn: {
    backgroundColor: "#14532d",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    flex: 1,
  },

  primaryText: { color: "#fff", fontWeight: "700" },

  dangerBtn: {
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef4444",
  },

  dangerText: { color: "#b91c1c", fontWeight: "700" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
  },

  modalText: { marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "space-between" },
});
