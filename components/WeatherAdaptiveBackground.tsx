"use client";

import { useEffect, useMemo, useState } from "react";

type WeatherTheme = {
  id: string;
  backgroundColor: string;
  overlayColor: string;
  image: string;
  textColor: string;
  description: string;
};

type WeatherState = {
  cityLabel: string;
  temperature: number | null;
  description: string;
};

const DEFAULT_THEME: WeatherTheme = {
  id: "default",
  backgroundColor: "#0f172a",
  overlayColor: "rgba(15, 23, 42, 0.55)",
  image: "/backgrounds/clear-night.svg",
  textColor: "#f8fafc",
  description: "Aguardando dados meteorológicos",
};

const THEME_MAP: Record<string, WeatherTheme> = {
  "clear-day": {
    id: "clear-day",
    backgroundColor: "#38bdf8",
    overlayColor: "rgba(14, 116, 144, 0.45)",
    image: "/backgrounds/clear-day.svg",
    textColor: "#082f49",
    description: "Céu limpo",
  },
  "clear-night": {
    id: "clear-night",
    backgroundColor: "#111827",
    overlayColor: "rgba(15, 23, 42, 0.65)",
    image: "/backgrounds/clear-night.svg",
    textColor: "#e2e8f0",
    description: "Noite limpa",
  },
  cloudy: {
    id: "cloudy",
    backgroundColor: "#cbd5f5",
    overlayColor: "rgba(30, 64, 175, 0.35)",
    image: "/backgrounds/cloudy.svg",
    textColor: "#0f172a",
    description: "Nublado",
  },
  fog: {
    id: "fog",
    backgroundColor: "#cbd5f5",
    overlayColor: "rgba(71, 85, 105, 0.35)",
    image: "/backgrounds/fog.svg",
    textColor: "#0f172a",
    description: "Neblina",
  },
  rainy: {
    id: "rainy",
    backgroundColor: "#1e293b",
    overlayColor: "rgba(30, 64, 175, 0.55)",
    image: "/backgrounds/rainy.svg",
    textColor: "#e2e8f0",
    description: "Chuva",
  },
  snowy: {
    id: "snowy",
    backgroundColor: "#f8fafc",
    overlayColor: "rgba(59, 130, 246, 0.35)",
    image: "/backgrounds/snowy.svg",
    textColor: "#0f172a",
    description: "Neve",
  },
  storm: {
    id: "storm",
    backgroundColor: "#020617",
    overlayColor: "rgba(147, 197, 253, 0.25)",
    image: "/backgrounds/storm.svg",
    textColor: "#e0f2fe",
    description: "Tempestade",
  },
};

function getWeatherTheme(weatherCode: number, isDay: boolean): WeatherTheme {
  if ([0].includes(weatherCode)) {
    return isDay ? THEME_MAP["clear-day"] : THEME_MAP["clear-night"];
  }

  if ([1, 2, 3].includes(weatherCode)) {
    return isDay ? THEME_MAP["cloudy"] : THEME_MAP["clear-night"];
  }

  if ([45, 48].includes(weatherCode)) {
    return THEME_MAP["fog"];
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)
  ) {
    return THEME_MAP["rainy"];
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return THEME_MAP["snowy"];
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return THEME_MAP["storm"];
  }

  return isDay ? THEME_MAP["clear-day"] : THEME_MAP["clear-night"];
}

function getWeatherDescription(weatherCode: number): string {
  if (weatherCode === 0) return "Céu limpo";
  if (weatherCode === 1) return "Predominantemente limpo";
  if (weatherCode === 2) return "Parcialmente nublado";
  if (weatherCode === 3) return "Nublado";
  if ([45, 48].includes(weatherCode)) return "Neblina";
  if ([51, 53, 55].includes(weatherCode)) return "Garoa";
  if ([56, 57].includes(weatherCode)) return "Garoa congelante";
  if ([61, 63, 65].includes(weatherCode)) return "Chuva";
  if ([66, 67].includes(weatherCode)) return "Chuva congelante";
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "Neve";
  if ([80, 81, 82].includes(weatherCode)) return "Aguaceiros";
  if ([95, 96, 99].includes(weatherCode)) return "Tempestade";
  return "Condição desconhecida";
}

async function resolveCityLabel(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "FlowGuiltPomodoro/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Falha ao buscar endereço");
    }

    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
      };
      display_name?: string;
    };

    const address = data.address;
    if (!address) {
      return data.display_name ?? "Localização desconhecida";
    }

    const locality =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.state;
    const country = address.country;

    if (locality && country) {
      return `${locality}, ${country}`;
    }

    return data.display_name ?? "Localização detectada";
  } catch (error) {
    console.error("Erro ao resolver cidade", error);
    return "Localização desconhecida";
  }
}

type Props = {
  children: React.ReactNode;
};

export function WeatherAdaptiveBackground({ children }: Props) {
  const [theme, setTheme] = useState<WeatherTheme>(DEFAULT_THEME);
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setErrorMessage("Geolocalização não suportada no dispositivo");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`,
          );

          if (!weatherResponse.ok) {
            throw new Error("Falha ao consultar previsão do tempo");
          }

          const weatherData = (await weatherResponse.json()) as {
            current_weather?: {
              temperature: number;
              weathercode: number;
              is_day: number;
            };
            timezone?: string;
          };

          if (!weatherData.current_weather) {
            throw new Error("Resposta meteorológica incompleta");
          }

          const { temperature, weathercode, is_day } = weatherData.current_weather;
          const themeResult = getWeatherTheme(weathercode, is_day === 1);

          const [cityLabel] = await Promise.all([
            resolveCityLabel(latitude, longitude),
          ]);

          if (!cancelled) {
            setTheme(themeResult);
            setWeatherState({
              cityLabel,
              temperature,
              description: getWeatherDescription(weathercode),
            });
            setErrorMessage(null);
          }
        } catch (error) {
          console.error(error);
          if (!cancelled) {
            setErrorMessage("Não foi possível obter o clima da sua região");
            setTheme(DEFAULT_THEME);
          }
        }
      },
      (geoError) => {
        console.error(geoError);
        setErrorMessage("Permita o acesso à localização para personalizar o tema");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60 * 60 * 1000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const overlayStyle = useMemo(() => {
    return {
      backgroundColor: theme.overlayColor,
    } as const;
  }, [theme.overlayColor]);

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: theme.backgroundColor,
      backgroundImage: `url(${theme.image})`,
      backgroundPosition: "center",
      backgroundSize: "cover",
      color: theme.textColor,
    } as const;
  }, [theme.backgroundColor, theme.image, theme.textColor]);

  return (
      <div
        className="min-h-screen w-full bg-slate-950 text-slate-100 transition-colors duration-700 ease-out"
        style={containerStyle}
      >
        <div className="relative min-h-screen w-full">
          <div
            className="absolute inset-0 pointer-events-none"
            style={overlayStyle}
            aria-hidden
          />
          <div className="relative z-10 flex min-h-screen flex-col">
            <div className="flex items-start justify-end px-6 pt-6">
              <div
                className="max-w-xs rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right text-sm backdrop-blur-xl"
                style={{ color: theme.textColor }}
              >
              {weatherState ? (
                <>
                  <p className="font-semibold">{weatherState.cityLabel}</p>
                  <p>
                    {weatherState.description}
                    {weatherState.temperature != null && (
                      <span className="ml-2 font-medium">
                        {weatherState.temperature.toFixed(1)}°C
                      </span>
                    )}
                  </p>
                </>
              ) : errorMessage ? (
                <p className="font-medium">{errorMessage}</p>
              ) : (
                <p className="font-medium">Personalizando experiência...</p>
              )}
            </div>
          </div>

            <main className="flex flex-1 items-center justify-center p-6">
              {children}
            </main>
        </div>
      </div>
    </div>
  );
}
