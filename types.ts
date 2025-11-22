export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  locationName: string;
  description: string;
}

export interface MandalaConfig {
  colors: string[];
  shapeType: 'circle' | 'triangle' | 'petal' | 'square';
  layerCount: number;
  rotationSpeed: number; // 0 to 10
  complexity: number; // 0 to 10
  strokeWidth: number;
}

export interface AppState {
  weather: WeatherData | null;
  mandala: MandalaConfig | null;
  groundingUrls: Array<{ title: string; uri: string }> | null;
  loading: boolean;
  error: string | null;
  step: 'intro' | 'locating' | 'analyzing' | 'experience';
}
