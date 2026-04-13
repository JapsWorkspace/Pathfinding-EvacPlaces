// screens/components/AppDrawer.jsx
import React, { useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../UserContext";

/* ========= SAME CONSTANTS AS Profile.jsx ========= */
const BASE_URL = "http://192.168.1.4:8000";
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=E5E7EB&color=6B7280&rounded=true&name=User";

/* ========= ICON SET ========= */
const iconSet = {
  safety: require("../../stores/assets/safetyblack.png"),
  incident: require("../../stores/assets/incidentreportblack.png"),
  digital: require("../../stores/assets/digitalblack.png"),
  virtual: require("../../stores/assets/virtualblack.png"),
  guide: require("../../stores/assets/guidelinesblack.png"),
  settings: require("../../stores/assets/settingsblack.png"),
};

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.78;

export default function AppDrawer({ onRequestClose, onLogout }) {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  /* ========= SLIDE ANIMATION ========= */
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, []);

  const closeDrawer = (cb) => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      onRequestClose();
      cb?.();
    });
  };

  const goTo = (route) => {
    closeDrawer(() => navigation.navigate(route));
  };

  const handleLogout = async () => {
    closeDrawer(async () => {
      await onLogout(); // Root navigator switches to AuthStack
    });
  };

  const avatarUri = user?.avatar
    ? `${BASE_URL}${user.avatar}`
    : DEFAULT_AVATAR;

  return (
    <View style={styles.overlay}>
      {/* ===== DRAWER ===== */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
      >
        {/* ===== BACK BUTTON ===== */}
        <TouchableOpacity onPress={() => closeDrawer()} style={styles.backBtn}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        {/* ===== PROFILE (LEFT‑ALIGNED) ===== */}
        <View style={styles.profile}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <Text style={styles.name}>
            {user?.fname} {user?.lname}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.divider} />

        {/* ===== MENU ===== */}
        <DrawerItem icon={iconSet.safety} label="Safety Marking" onPress={() => goTo("Connection")} />
        <DrawerItem icon={iconSet.incident} label="Incident Tagging" onPress={() => goTo("IncidentReport")} />
        <DrawerItem icon={iconSet.digital} label="Digital Twin" onPress={() => goTo("RiskHeatMap")} />
        <DrawerItem icon={iconSet.virtual} label="Virtual Twin" onPress={() => goTo("MainCenter")} />
        <DrawerItem icon={iconSet.guide} label="Education & Guidelines" onPress={() => goTo("Guidelines")} />
        <DrawerItem icon={iconSet.settings} label="Account Settings" onPress={() => goTo("Profile")} />

        {/* ===== SIGN OUT ===== */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ===== BACKDROP ===== */}
      <TouchableOpacity style={styles.backdrop} onPress={() => closeDrawer()} />
    </View>
  );
}

function DrawerItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Image source={icon} style={styles.icon} />
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 9999,
    elevation: 9999,
  },

  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: "#F3F4F6",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  backBtn: {
    marginBottom: 16,
  },

  back: {
    fontSize: 22,
  },

  /* ✅ LEFT‑ALIGNED PROFILE */
  profile: {
    alignItems: "flex-start",   // ✅ KEY FIX
    marginBottom: 20,
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 100,
    marginBottom: 12,
    backgroundColor: "#E5E7EB",
  },

  name: {
    fontSize: 30,
    fontWeight: "00",
  },

  email: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  icon: {
    width: 22,
    height: 22,
    marginRight: 14,
    resizeMode: "contain",
  },

  itemText: {
    fontSize: 14,
  },

  logout: {
    marginTop: 28,
    backgroundColor: "#0a5915",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});