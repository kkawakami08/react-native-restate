import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const Property = () => {
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView>
      <Text>Property {id}</Text>
    </SafeAreaView>
  );
};

export default Property;

const styles = StyleSheet.create({});
