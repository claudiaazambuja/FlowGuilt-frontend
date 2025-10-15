import { BackgroundPlaylistPopover } from "@/components/pomodoro/BackgroundPlaylistPopover";
import { WeatherAdaptiveBackground } from "@/components/WeatherAdaptiveBackground";

export default function Page() {
  return (
    <WeatherAdaptiveBackground>
      <BackgroundPlaylistPopover initialOpen dismissible={false} showTrigger={false} />
    </WeatherAdaptiveBackground>
  );
}
