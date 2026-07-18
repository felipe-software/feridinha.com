import clsx from "clsx"
export const Selector = ({
    options,
    keys,
    onClick,
    selected,
    icon,
}: {
    options: string[]
    keys: string[]
    onClick: (key: string) => void
    selected: string
    icon?: React.ReactNode
}) => {
    return (
        <div className={clsx("flex flex-row gap-2 rounded-xl bg-dracula-gray/40 p-1! text-white items-center", icon && "pl-2!")}>
            {icon}
            {keys.map((key, i) => (
                <button
                    className={clsx(
                        "reset px-1! py-1! rounded-md  duration-200 flex items-center! gap-1",
                        key === selected && "bg-dracula-green! text-black",
                        key !== selected && "text-white/40 hover:text-white!",
                    )}
                    onClick={() => {
                        onClick(key)
                    }}
                    key={key}
                >
                    {/* {i === 0 && icon} */}
                    <p className="">{options[i]}</p>
                </button>
            ))}
        </div>
    )
}
