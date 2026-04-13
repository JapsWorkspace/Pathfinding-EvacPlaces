// screens/AppShell.jsx

import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import AppLayout from "./AppLayout";
import NewBottomNav from "./NewBottomNav";

import MainCenter from "./MainCenter";
import Map from "./Map";
import IncidentReportScreen from "./IncidentReportingScreen";
import Profile from "./Profile";
import RiskHeatMap from "./RiskHeatMap";
import Guidelines from "./Guidelines";
import SafetyMark from "./SafetyMark";

import { MapContext } from "./contexts/MapContext";
import api from "../lib/api";

const Stack = createNativeStackNavigator();

export default function AppShell() {
  /* =========================
     PANEL + ROUTING STATE
  ========================= */

  const [panelState, setPanelState] = useState("HIDDEN");
  const [panelY, setPanelY] = useState(null);
  const [routeRequested, setRouteRequested] = useState(false);

  /* =========================
     EVAC + ROUTE DATA
  ========================= */

  const [evac, setEvac] = useState(null);

  // ✅ NEW: ALL evacuation centers (GLOBAL)
  const [evacPlaces, setEvacPlaces] = useState([]);

  const [routes, setRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null);
  const [travelMode, setTravelMode] = useState("walking");

  /* =========================
     INCIDENT REPORTS ✅
  ========================= */

  const [incidents, setIncidents] = useState([]);

  // ✅ REFRESH INCIDENTS WHEN MAP / APP GAINS FOCUS
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      console.log("[AppShell] fetching incidents...");

      api
        .get("/incident/getIncidents")
        .then((res) => {
          if (mounted && Array.isArray(res.data)) {
            setIncidents(res.data);
          }
        })
        .catch((err) => {
          console.log("[AppShell] failed to fetch incidents", err);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  /* =========================
     CONTEXT VALUE
  ========================= */

  const mapContextValue = useMemo(
    () => ({
      /* panel */
      panelState,
      setPanelState,
      panelY,
      setPanelY,

      /* routing */
      routeRequested,
      setRouteRequested,

      /* evac (selected) */
      evac,
      setEvac,

      /* ✅ evac centers (ALL) */
      evacPlaces,
      setEvacPlaces,

      /* route data */
      routes,
      setRoutes,
      activeRoute,
      setActiveRoute,

      /* travel mode */
      travelMode,
      setTravelMode,

      /* incidents */
      incidents,
      setIncidents,
    }),
    [
      panelState,
      panelY,
      routeRequested,
      evac,
      evacPlaces,
      routes,
      activeRoute,
      travelMode,
      incidents,
    ]
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <View style={styles.root}>
      <MapContext.Provider value={mapContextValue}>
        <AppLayout>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainCenter" component={MainCenter} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen
              name="IncidentReport"
              component={IncidentReportScreen}
            />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="RiskHeatMap" component={RiskHeatMap} />
            <Stack.Screen name="Guidelines" component={Guidelines} />
            <Stack.Screen name="Connection" component={SafetyMark} />
          </Stack.Navigator>
        </AppLayout>
      </MapContext.Provider>

      {/* Bottom navigation (must stay above map but below FABs) */}
      <View style={styles.navWrapper} pointerEvents="box-none">
        <NewBottomNav />
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  root: { flex: 1 },

  navWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    elevation: 200,
  },
});
