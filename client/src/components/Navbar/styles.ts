import styled from "styled-components"

const Nav = styled.nav`
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    background-color: var(--base-dark);
    height: 80px;
    min-height: 80px;
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
                    text-shadow: 0 0 1px var(--dracula-cyan);
                    color: var(--dracula-cyan);
                }
            }
        }
    }

    a.logo {
        display: flex;
        margin: 0 1rem;
        margin-right: 1rem;
        gap: 1.5rem;
        align-items: center;
        height: 100%;
        width: 15rem;

        svg {
            fill: #f8f8f8;
        }
    }

    .locale-selector {
        display: flex;
        align-items: center;
        flex: 0 0 auto;
        z-index: 7;
    }

    .language-toggle {
        padding: 0.65rem 0;
        border: 0;
        background: transparent;
        color: var(--foreground);
        cursor: pointer;
        font-size: 0.8rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        line-height: 1;
        white-space: nowrap;

        span {
            color: #696b7b;
        }

        &:focus-visible {
            outline: 2px solid var(--nav-highlight);
            outline-offset: 0.25rem;
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
        gap: 10px;
        margin-left: auto;

        a {
            display: flex;
            justify-content: center;
            position: relative;
            text-decoration: none;
            border-radius: var(--border-radius-s);
            padding: 0.5rem 1rem;
            border: 1px solid transparent;
            text-transform: uppercase;
            text-shadow: 0 0 0 var(--nav-highlight);
            transition: text-shadow 0.5s, color 0.5s, background-color 0.5s,
                box-shadow 0.5s;

            &:hover {
                background-color: var(--base);
            }

            &.active {
                color: var(--nav-highlight);
                text-shadow: 0 0 5px var(--nav-highlight);
            }
        }

        span.underline_active {
            position: absolute;
            content: "";
            height: 2px;
            background-color: var(--nav-highlight);
            width: calc(100% - 3rem);
            bottom: 3px;
            margin: auto;
            box-shadow: 0 0 5px 0.5px var(--nav-highlight);
            border-radius: 2px;
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
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 7;
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

    @media (max-width: 1100px) {
        & {
            padding: 0 1rem;
        }

        .burgerMenu {
            padding: 0 0.5rem;
        }

        .brain-made {
            display: none !important;
        }

        .locale-selector {
            .language-toggle {
                font-size: 0.76rem;
            }
        }
    }

`

export default Nav
