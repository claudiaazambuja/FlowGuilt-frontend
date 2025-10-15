import PomodoroPanel from "@/components/pomodoro/PomodoroPanel";
import { WeatherAdaptiveBackground } from "@/components/WeatherAdaptiveBackground";

export default function Page() {
  return (
    <WeatherAdaptiveBackground>
      <PomodoroPanel />
    </WeatherAdaptiveBackground>
  );
}
