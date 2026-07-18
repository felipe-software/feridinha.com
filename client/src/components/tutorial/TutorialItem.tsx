import { ExpandableCard } from "@/components/ExpandableCard"
import styled from "styled-components"

const ContentWrapper = styled.div`
    li {
        color: #f8f8f8;
    }

    * {
        color: #f8f8f8;
    }
`

export default function TutorialItem({
    title,
    content,
    icon,
    handleActive,
    itemId,
    currentActive,
}: {
    title: string
    content: JSX.Element
    icon: string | string[]
    itemId: string
    handleActive: (itemId: string | null) => void
    currentActive: string | null
}) {
    const icons = Array.isArray(icon) ? icon : [icon]

    return (
        <ExpandableCard
            iconInjected={
                <div className="icons-wrapper">
                    {icons.map((icon, index) => (
                        <img
                            alt="logo"
                            width={40}
                            height={40}
                            className="icon"
                            key={index}
                            src={icon}
                            loading="lazy"
                        ></img>
                    ))}
                </div>
            }
            title={title}
            content={<ContentWrapper>{content}</ContentWrapper>}
            injectedOpen={currentActive === itemId}
            injectedOnClick={() => handleActive(itemId)}
        ></ExpandableCard>
    )

    // return (
    //     <ItemBase
    //         onClick={() => handleActive(itemId)}
    //         className="no-select"
    //         style={
    //             {
    //                 // zIndex: isActive ? 9 : 1,
    //             }
    //         }
    //     >
    //         <button className="header">
    //             <div className="icons-wrapper">
    //                 {icons.map((icon, index) => (
    //                     <img
    //                         alt="logo"
    //                         width={40}
    //                         height={40}
    //                         className="icon"
    //                         key={index}
    //                         src={icon}
    //                         loading="lazy"
    //                     ></img>
    //                 ))}
    //             </div>
    //             {title}
    //             <motion.span
    //                 animate={{ rotateZ: isActive ? 180 : 0 }}
    //                 className="notranslate material-icon"
    //                 transition={{ duration: 0.25, ease: "easeIn" }}
    //             >
    //                 arrow_drop_down
    //             </motion.span>
    //         </button>
    //         <AnimatePresence mode="sync" key={3}>
    //             {isActive && <ContentWrapper key={2}>{content}</ContentWrapper>}
    //         </AnimatePresence>
    //     </ItemBase>
    // )
}
