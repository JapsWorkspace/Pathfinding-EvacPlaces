import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

export default function MapControls({ onRecenter }) {
  return (
    <View style={{ position: "absolute", right: 12, bottom: 160 }}>
      <TouchableOpacity
        onPress={onRecenter}
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 30,
          elevation: 3,
        }}
      >
        <Text>📍</Text>
      </TouchableOpacity>
    </View>
  );
}
