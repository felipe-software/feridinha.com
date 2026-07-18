"use client"
import Script from "next/script"
import styled from "styled-components"


const VideoWrapper = styled.div`
    /* max-width: 100%; */
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;

    background-color: var(--base-dark);
    --max-height: 30rem;
    /* max-height: var(--max-height); */
    video {
        max-height: var(--max-height);
    }
    overflow: hidden;
    border-radius: 0.5rem;
`

export const RedditEmbed = () => {
    return (
        <div>
            <blockquote
                className="reddit-embed-bq"
                data-embed-theme="dark"
                style={{ height: "500px" }}
                data-embed-created="2026-02-21T00:43:09Z"
            >
                <a href="https://www.reddit.com/r/dataisbeautiful/comments/uul3kh/oc_travel_durations_from_paris_by_train_minute_by/">
                    [OC] Travel durations from Paris by train, minute by minute
                </a>
                <br /> by
                <a href="https://www.reddit.com/user/gmilloue/">u/gmilloue</a>
                in
                <a href="https://www.reddit.com/r/dataisbeautiful/">
                    dataisbeautiful
                </a>
            </blockquote>
            <Script async src="https://embed.reddit.com/widgets.js"></Script>
        </div>
    )
}

export const TiktokEmbed = () => {
    return (
        <div>
            <blockquote
                className="tiktok-embed"
                cite="https://www.tiktok.com/@carlo99992/video/7607681087707417876"
                data-video-id="7607681087707417876"
                data-embed-from="oembed"
                style={{ width: "100%" }}
                // style="max-width:605px; min-width:325px;"
            >
                <section></section>
            </blockquote>
            <script async src="https://www.tiktok.com/embed.js"></script>
        </div>
    )
}

export const RedditEmbedPure = () => {
    return (
        <VideoWrapper>
            <video
                src={
                    "https://vxreddit.com/redditvideo.mp4?video_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_360.mp4&audio_url=https%3A%2F%2Fv.redd.it%2Fepcqrklak3lg1%2FCMAF_AUDIO_128.mp4"
                }
                controls={true}
            ></video>
        </VideoWrapper>
    )
}

export const InstagramEmbedPure = () => {
    return (
        <VideoWrapper>
            <video
                src={"https://instafix.zzinstagram.com/videos/DU04xhLCKEr/1"}
                controls={true}
            ></video>
        </VideoWrapper>
    )
}

export const TiktokEmbedPure = () => {
    return (
        <VideoWrapper>
            <video
                src={
                    "https://offload.tnktok.com/generate/video/7607681087707417876.mp4"
                }
                controls={true}
            ></video>
        </VideoWrapper>
    )
}
