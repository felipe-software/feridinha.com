import styled from "styled-components"

const Nav = styled.nav`
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    background-color: var(--base-dark);
    height: 6.6667rem;
    min-height: 6.6667rem;
    align-items: center;
    z-index: 6;
    margin: unset;
    padding: 0 2rem;
    user-select: none;

    .description-container {
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        

        p.fake {
            opacity: 0;
            font-size: 0.8rem;
            visibility: hidden;
        }
    }
    .description-wrapper {
        display: flex;
        height: fit-content;

        > p.description {
            color: #44475a;
            /* padding: 1rem 0; */
            font-size: 1rem;

            a {
                color: var(--dracula-cyan);
                text-decoration: underline;
                color: #53576d;
                transition: .2s;
                &:hover {
                    text-shadow: 0 0 0.0833rem var(--dracula-cyan);
                    color: var(--dracula-cyan);
                }
            }
        }
    }

    a.logo {
        position: relative;
        z-index: 1000;
        display: flex;
        margin: 0 1rem 0 0.5rem;
        gap: 1.5rem;
        align-items: center;
        height: 100%;
        width: 15rem;

        svg {
            fill: #f8f8f8;
        }
    }

    .locale-selector {
        position: relative;
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        z-index: 7;
    }

    .language-toggle {
        width: 3.6667rem;
        height: 3.6667rem;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: var(--border-radius-m);
        background: transparent;
        color: #a7a9b3;
        cursor: pointer;
        line-height: 1;
        transition: color 0.15s ease;

        svg {
            width: 1.65rem;
            height: 1.65rem;
            pointer-events: none;
            stroke-width: 2;
            filter: drop-shadow(0 0.0833rem 0 rgba(0, 0, 0, 0.8))
                drop-shadow(0 -0.0833rem 0 rgba(255, 255, 255, 0.06));
        }

        &:hover {
            color: #d3d5dc;
        }

        &[aria-expanded="true"] {
            color: #d3d5dc;
        }

        &:focus-visible {
            outline: 0.1667rem solid #a7a9b3;
            outline-offset: 0.25rem;
        }
    }

    .language-popover {
        width: 13.3333rem;
        border: 0.0833rem solid #353745;
        background-color: var(--base-dark-transparent) !important;
        box-shadow: 0 1rem 2.6667rem rgba(8, 8, 14, 0.35);

        .tippy-content {
            padding: 0.4rem;
        }

        .tippy-arrow {
            color: #353745;

            svg {
                stroke: #353745;
            }
        }
    }

    .language-menu {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
    }

    .language-option {
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr) 1.3333rem;
        align-items: center;
        gap: 0.65rem;
        width: 100%;
        min-height: 3.6667rem;
        margin: 0;
        padding: 0.55rem 0.65rem;
        border: 0.0833rem solid transparent;
        border-radius: var(--border-radius-s);
        background: transparent;
        color: var(--foreground);
        cursor: pointer;
        font-size: 1.1667rem;
        font-weight: 500;
        line-height: 1.2;
        text-align: left;
        transition: color 0.15s ease, background-color 0.15s ease,
            border-color 0.15s ease;

        &:hover:not(:disabled) {
            color: #d3d5dc;
            background-color: rgba(255, 255, 255, 0.055);
            border-color: rgba(255, 255, 255, 0.11);
        }

        &:focus-visible {
            outline: 0.1667rem solid #a7a9b3;
            outline-offset: -0.1667rem;
        }

        &:disabled {
            opacity: 1;
            color: var(--nav-highlight);
            background-color: var(--base);
            cursor: default;
            font-weight: 600;
        }
    }

    .language-flag {
        display: block;
        width: 2rem;
        height: 2rem;
        object-fit: contain;
    }

    .language-check {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--nav-highlight);

        svg {
            width: 1.3333rem;
            height: 1.3333rem;
            stroke-width: 2.5;
        }
    }

    a {
        text-decoration: none;
        color: #f8f8f8;
    }

    h2 a {
        margin: 0;
        z-index: 7;
    }

    .links {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.8333rem;
        margin-left: auto;

        a {
            display: flex;
            justify-content: center;
            position: relative;
            text-decoration: none;
            border-radius: var(--border-radius-s);
            padding: 0.5rem 1rem;
            border: 0.0833rem solid transparent;
            text-transform: uppercase;
            text-shadow: 0 0 0 var(--nav-highlight);
            transition: text-shadow 0.5s, color 0.5s, background-color 0.5s,
                box-shadow 0.5s;

            &:hover {
                background-color: var(--base);
            }

            &.active {
                color: var(--nav-highlight);
                text-shadow: 0 0 0.4167rem var(--nav-highlight);
            }
        }

        span.underline_active {
            position: absolute;
            content: "";
            height: 0.1667rem;
            background-color: var(--nav-highlight);
            width: calc(100% - 3rem);
            bottom: 0.25rem;
            margin: auto;
            box-shadow: 0 0 0.4167rem 0.0417rem var(--nav-highlight);
            border-radius: 0.1667rem;
            z-index: 4;
            transition: text-shadow 0.5s, color 0.5s, background-color 0.5s,
                box-shadow 0.5s;
        }
    }

    .menu {
        position: fixed;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        width: 100vw;
        height: 100vh;
        background-color: rgba(17, 18, 24, 1);
        inset: 0;
        z-index: 999;

        a {
            position: relative;
            font-size: 1.25rem;
            text-transform: uppercase;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            border-radius: var(--border-radius-m);
            transition: all 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;

            &::before {
                position: absolute;
                content: "";
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    79.23deg,
                    rgb(255, 128, 191) -2.25%,
                    rgb(149, 128, 255)
                );
                opacity: 0;
                z-index: -1;
                transition: opacity 0.2s;
                border-radius: var(--border-radius-m);
            }

            &.active::before {
                opacity: 1;
            }
        }

    }

    .burgerMenu {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        border: none;
        background: none;
        margin-left: auto;
        padding: 0 1.5rem;

        span {
            color: var(--foreground);
            font-size: 2.5rem;
        }

        * {
            cursor: pointer;
        }

        input[type="checkbox"] {
            position: absolute;
            width: 100%;
            height: 100%;
            opacity: 0;
        }
    }

    @media (max-width: 91.6667rem) {
        & {
            padding: 0 1rem;
        }

        .burgerMenu {
            padding: 0 0.5rem;
        }

        .brain-made {
            display: none !important;
        }

    }

`

export default Nav
