import "dayjs/locale/pt-br"
import {
    MediaControlBar,
    MediaController,
    MediaFullscreenButton,
    MediaMuteButton,
    MediaPlayButton,
    MediaTimeDisplay,
    MediaTimeRange,
    MediaVolumeRange,
} from "media-chrome/react"
import ReactPlayer from "react-player"

export const PostPlayer = ({ src }: { src: string }) => {
    return (
        <MediaController
            style={{
                width: "100%",
                aspectRatio: "16/9",
                // background: "var(--dracula-base)",
                // @ts-ignore
                "--media-control-height": "12px",

                "--media-button-icon-width": "38px",
                "--media-button-icon-height": "18px",
            }}
            className="media-controller bg-dracula-base/25"
        >
            <ReactPlayer
                slot="media"
                style={{
                    width: "100%",
                    height: "100%",
                    // @ts-ignore
                    "--controls": "none",
                }}
                src={src}
                controls={false}
                onVolumeChange={(_e) => {}}
            ></ReactPlayer>
            <MediaControlBar>
                <MediaPlayButton />
                <MediaTimeDisplay style={{ padding: "0 8px" }} showDuration />
                <MediaTimeRange />
                <MediaMuteButton />
                <MediaVolumeRange />
                <MediaFullscreenButton />
            </MediaControlBar>
        </MediaController>
    )
}
