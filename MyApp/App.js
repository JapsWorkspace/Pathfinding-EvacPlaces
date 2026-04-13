// App.js — DEBUG VERSION

import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GetStarted from "./screens/GetStarted";
import LogIn from "./screens/LogIn";
import PrivacyGate from "./screens/PrivacyGate";
import SignUp from "./screens/SignUp";
import SendOtp from "./screens/SendOtp";
import VerifyOtp from "./screens/VerifyOtp";

import PasswordSecurity from "./screens/PasswordSecurity";
import PersonalDetails from "./screens/PersonalDetails";
import AppShell from "./screens/AppShell";

import { UserProvider } from "./screens/UserProvider";
import { UserContext } from "./screens/UserContext";

const Stack = createNativeStackNavigator();

/* ================= AUTH STACK ================= */
function AuthStack() {
  console.log("🔁 AuthStack render");

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GetStarted" component={GetStarted} />
      <Stack.Screen name="LogIn" component={LogIn} />
      <Stack.Screen name="PrivacyGate" component={PrivacyGate} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="SendOtp" component={SendOtp} />
      <Stack.Screen
        name="VerifyOtp"
        component={VerifyOtp}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

/* ================= APP STACK ================= */
function AppStack() {
  console.log("🔁 AppStack render");

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppShell" component={AppShell} />
      <Stack.Screen name="PasswordSecurity" component={PasswordSecurity} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetails} />
    </Stack.Navigator>
  );
}

/* ================= ROOT SWITCH ================= */
function RootNavigator() {
  const context = useContext(UserContext);

  console.log("🔁 RootNavigator render");
  console.log("   user =", context?.user);
  console.log("   loading =", context?.loading);

  // 🔴 IMPORTANT: do NOT short-circuit yet
  // We want to SEE what's happening
  if (context?.loading) {
    console.log("⏳ RootNavigator waiting for auth");
    return null;
  }

  return context?.user ? <AppStack /> : <AuthStack />;
}

/* ================= APP ROOT ================= */
export default function App() {
  console.log("🔥 App render");

  return (
    <UserProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </UserProvider>
  );
}