import * as Location from "expo-location";
import { Platform } from "react-native";

export interface RouteLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recordedAt: string;
}

export async function capturarLocalizacaoRota(): Promise<RouteLocation> {
  let permission = await Location.getForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    permission = await Location.requestForegroundPermissionsAsync();
  }

  if (permission.status !== "granted") {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  if (Platform.OS !== "web" && !(await Location.hasServicesEnabledAsync())) {
    throw new Error("LOCATION_SERVICES_DISABLED");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    recordedAt: new Date(position.timestamp).toISOString(),
  };
}
