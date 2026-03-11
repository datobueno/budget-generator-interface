"use client"

import * as React from "react"
import {
  Autocomplete as ComboboxPrimitive,
  Combobox as LegacyComboboxPrimitive,
} from "@base-ui/react"
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  menuItemClassName,
  menuItemInteractiveClassName,
  menuSubContentSurfaceClassName,
  menuSubTriggerClassName,
} from "@/components/ui/context-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"

const ComboboxRoot = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="combobox-trigger-icon"
        className="pointer-events-none size-4 text-muted-foreground"
      />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  inputClassName,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
  inputClassName?: string
}) {
  const hasAddonContent = showTrigger || showClear || Boolean(children)

  return (
    <InputGroup
      className={cn(
        "w-auto min-w-0 overflow-hidden rounded-[8px] border border-transparent bg-transparent shadow-none transition-[border-color,box-shadow,background-color]",
        "hover:border-[#e4e4e7] hover:bg-white hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
        "has-[[data-slot=input-group-control]:focus]:border-[#e4e4e7] has-[[data-slot=input-group-control]:focus]:bg-white has-[[data-slot=input-group-control]:focus]:ring-[3px] has-[[data-slot=input-group-control]:focus]:ring-ring/50 has-[[data-slot=input-group-control]:focus]:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/40",
        className
      )}
    >
      <ComboboxPrimitive.Input
        data-slot="input-group-control"
        disabled={disabled}
        className={cn(
          "min-w-0 flex-1 cursor-text overflow-hidden text-ellipsis whitespace-nowrap rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
          inputClassName,
          "!border-0 !shadow-none focus-visible:!ring-0"
        )}
        {...props}
      />
      {hasAddonContent ? (
        <InputGroupAddon align="inline-end">
          {showTrigger && (
            <InputGroupButton
              size="icon-xs"
              variant="ghost"
              asChild
              data-slot="input-group-button"
              className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
              disabled={disabled}
            >
              <ComboboxTrigger />
            </InputGroupButton>
          )}
          {showClear && <ComboboxClear disabled={disabled} />}
          {children}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

function ComboboxActionIcon({
  icon,
  className,
}: {
  icon?: React.ReactNode
  className?: string
}) {
  if (!icon) return null

  return (
    <span
      aria-hidden
      className={cn("flex size-4 shrink-0 items-center justify-center", className)}
    >
      {icon}
    </span>
  )
}

type ComboboxActionItem = {
  key: React.Key
  label: string
  icon?: React.ReactNode
  iconPosition?: "start" | "end"
  disabled?: boolean
  separatorAbove?: boolean
  onSelect: () => void
}

type ComboboxAction = {
  key: React.Key
  label: string
  icon?: React.ReactNode
  iconPosition?: "start" | "end"
  disabled?: boolean
  onSelect?: () => void
  items?: ComboboxActionItem[]
}

type ComboboxInputDataAttributes = Partial<Record<`data-${string}`, string>>

type ComboboxProps<T> = {
  value: string
  options: T[]
  placeholder?: string
  emptyText?: string
  emptyContent?: React.ReactNode
  disabled?: boolean
  className?: string
  inputClassName?: string
  contentClassName?: string
  endAdornment?: React.ReactNode
  getOptionLabel: (option: T) => string
  getOptionKey?: (option: T, index: number) => React.Key
  getOptionSection?: (option: T) => string
  renderSectionLabel?: (section: string) => React.ReactNode
  onValueChange: (nextValue: string) => void
  onOptionSelect: (option: T) => void
  renderOption?: (option: T, highlighted: boolean, index: number) => React.ReactNode
  actions?: ComboboxAction[]
  showOptionIndicator?: boolean
  autoFocusInput?: boolean
  activateOnMount?: boolean
  onActivated?: () => void
  externalFilter?: boolean
  autocompleteMode?: "none" | "list"
  interactive?: boolean
  openOnFocus?: boolean
  openOnEnterWhenClosed?: boolean
  inputDataAttributes?: ComboboxInputDataAttributes
  "aria-invalid"?: boolean
  onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onInputFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  onInputBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onInputClick?: (event: React.MouseEvent<HTMLInputElement>) => void
  onInputEnter?: (
    currentValue: string,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => void
}

function Combobox<T>({
  value,
  options,
  placeholder,
  emptyText = "No matches.",
  emptyContent,
  disabled = false,
  className,
  inputClassName,
  contentClassName,
  endAdornment,
  getOptionLabel,
  getOptionKey,
  getOptionSection,
  renderSectionLabel,
  onValueChange,
  onOptionSelect,
  renderOption,
  actions = [],
  showOptionIndicator = true,
  autoFocusInput = false,
  activateOnMount = false,
  onActivated,
  externalFilter = false,
  autocompleteMode = "none",
  interactive = true,
  openOnFocus = false,
  openOnEnterWhenClosed = false,
  inputDataAttributes,
  "aria-invalid": ariaInvalid,
  onInputKeyDown,
  onInputFocus,
  onInputBlur,
  onInputClick,
  onInputEnter,
}: ComboboxProps<T>) {
  const anchorRef = useComboboxAnchor()
  const [open, setOpen] = React.useState(false)
  const [openActionKey, setOpenActionKey] = React.useState<React.Key | null>(null)
  const actionButtonRefs = React.useRef(new Map<React.Key, HTMLButtonElement | null>())
  const actionSubButtonRefs = React.useRef(
    new Map<React.Key, Map<React.Key, HTMLButtonElement | null>>()
  )
  const activationConsumedRef = React.useRef(false)
  const hasKeyboardHighlightRef = React.useRef(false)
  const highlightedOptionRef = React.useRef<T | null>(null)
  const getOptionLabelRef = React.useRef(getOptionLabel)
  const optionsRef = React.useRef(options)
  const onValueChangeRef = React.useRef(onValueChange)
  const onOptionSelectRef = React.useRef(onOptionSelect)

  getOptionLabelRef.current = getOptionLabel
  optionsRef.current = options
  onValueChangeRef.current = onValueChange
  onOptionSelectRef.current = onOptionSelect

  const blurInput = React.useCallback(() => {
    const input = anchorRef.current?.querySelector("input")
    if (input instanceof HTMLInputElement) {
      input.blur()
    }
  }, [anchorRef])
  const focusInput = React.useCallback(() => {
    const input = anchorRef.current?.querySelector("input")
    if (input instanceof HTMLInputElement) {
      input.focus()
      const cursorPosition = input.value.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    }
  }, [anchorRef])
  const deferFocus = React.useCallback((callback: () => void) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback)
    })
  }, [])
  const enabledActionKeys = React.useMemo(
    () => actions.filter((action) => !action.disabled).map((action) => action.key),
    [actions]
  )
  const getEnabledSubActionKeys = React.useCallback(
    (actionKey: React.Key) => {
      const action = actions.find((entry) => entry.key === actionKey)
      return (action?.items ?? [])
        .filter((item) => !item.disabled)
        .map((item) => item.key)
    },
    [actions]
  )
  const setActionButtonRef = React.useCallback(
    (actionKey: React.Key, node: HTMLButtonElement | null) => {
      actionButtonRefs.current.set(actionKey, node)
    },
    []
  )
  const setActionSubButtonRef = React.useCallback(
    (actionKey: React.Key, subActionKey: React.Key, node: HTMLButtonElement | null) => {
      const currentActionMap = actionSubButtonRefs.current.get(actionKey) ?? new Map()
      currentActionMap.set(subActionKey, node)
      actionSubButtonRefs.current.set(actionKey, currentActionMap)
    },
    []
  )
  const focusActionButton = React.useCallback((actionKey: React.Key) => {
    const button = actionButtonRefs.current.get(actionKey)
    if (!button) return false
    button.focus()
    return true
  }, [])
  const focusActionButtonAtIndex = React.useCallback(
    (index: number) => {
      if (enabledActionKeys.length === 0) return false
      const clampedIndex = Math.max(0, Math.min(enabledActionKeys.length - 1, index))
      return focusActionButton(enabledActionKeys[clampedIndex])
    },
    [enabledActionKeys, focusActionButton]
  )
  const focusSubActionButton = React.useCallback((actionKey: React.Key, subActionKey: React.Key) => {
    const button = actionSubButtonRefs.current.get(actionKey)?.get(subActionKey)
    if (!button) return false
    button.focus()
    return true
  }, [])
  const focusSubActionButtonAtIndex = React.useCallback(
    (actionKey: React.Key, index: number) => {
      const enabledSubActionKeys = getEnabledSubActionKeys(actionKey)
      if (enabledSubActionKeys.length === 0) return false
      const clampedIndex = Math.max(0, Math.min(enabledSubActionKeys.length - 1, index))
      return focusSubActionButton(actionKey, enabledSubActionKeys[clampedIndex])
    },
    [focusSubActionButton, getEnabledSubActionKeys]
  )
  const openSubmenuAndFocusFirstItem = React.useCallback(
    (actionKey: React.Key) => {
      setOpenActionKey(actionKey)
      deferFocus(() => {
        focusSubActionButtonAtIndex(actionKey, 0)
      })
    },
    [deferFocus, focusSubActionButtonAtIndex]
  )
  const closeSubmenuAndFocusAction = React.useCallback(
    (actionKey: React.Key) => {
      setOpenActionKey(null)
      deferFocus(() => {
        focusActionButton(actionKey)
      })
    },
    [deferFocus, focusActionButton]
  )
  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setOpenActionKey(null)
      hasKeyboardHighlightRef.current = false
      highlightedOptionRef.current = null
    }
    setOpen(nextOpen)
  }, [])
  const closePopup = React.useCallback(
    (options?: { preserveFocus?: boolean }) => {
      handleOpenChange(false)
      if (!options?.preserveFocus) {
        blurInput()
      }
    },
    [blurInput, handleOpenChange]
  )
  const handleInputKeyDownCapture = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!interactive) return
      if (
        (event.key === "ArrowDown" || event.key === "ArrowUp") &&
        options.length === 0 &&
        enabledActionKeys.length > 0
      ) {
        event.preventDefault()
        event.stopPropagation()
        if (!open) {
          setOpen(true)
          deferFocus(() => {
            focusActionButtonAtIndex(event.key === "ArrowDown" ? 0 : enabledActionKeys.length - 1)
          })
          return
        }
        focusActionButtonAtIndex(event.key === "ArrowDown" ? 0 : enabledActionKeys.length - 1)
        return
      }
      if (event.key !== "Enter" || event.nativeEvent.isComposing) return
      if (!open && openOnEnterWhenClosed) {
        event.preventDefault()
        event.stopPropagation()
        setOpenActionKey(null)
        setOpen(true)
        return
      }
      if (!onInputEnter) return
      if (hasKeyboardHighlightRef.current) return
      event.preventDefault()
      event.stopPropagation()
      handleOpenChange(false)
      onInputEnter?.(event.currentTarget.value, event)
    },
    [
      deferFocus,
      enabledActionKeys.length,
      focusActionButtonAtIndex,
      handleOpenChange,
      interactive,
      onInputEnter,
      open,
      openOnEnterWhenClosed,
      options.length,
    ]
  )
  const resolveOptionFromValue = React.useCallback((nextValue: string) => {
    const highlightedOption = highlightedOptionRef.current
    if (
      highlightedOption &&
      getOptionLabelRef.current(highlightedOption) === nextValue
    ) {
      return highlightedOption
    }

    return (
      optionsRef.current.find(
        (option) => getOptionLabelRef.current(option) === nextValue
      ) ?? null
    )
  }, [])
  const handleItemHighlighted = React.useCallback(
    (
      highlightedValue: unknown,
      eventDetails: ComboboxPrimitive.Root.HighlightEventDetails
    ) => {
      highlightedOptionRef.current = (highlightedValue as T | undefined) ?? null
      hasKeyboardHighlightRef.current =
        eventDetails.reason === "keyboard" && highlightedValue !== undefined
    },
    []
  )
  const handleRootValueChange = React.useCallback(
    (nextValue: string, eventDetails: ComboboxPrimitive.Root.ChangeEventDetails) => {
      if (eventDetails.reason === "item-press") {
        const selectedOption = resolveOptionFromValue(nextValue)
        if (selectedOption) {
          onOptionSelectRef.current(selectedOption)
        }
        closePopup({ preserveFocus: true })
        return
      }

      hasKeyboardHighlightRef.current = false
      onValueChangeRef.current(nextValue)
    },
    [closePopup, resolveOptionFromValue]
  )
  const itemToStringLabel = React.useCallback((itemValue: unknown) => {
    return getOptionLabelRef.current(itemValue as T)
  }, [])

  React.useEffect(() => {
    if (disabled || !interactive) return
    if (!activateOnMount || activationConsumedRef.current) return
    activationConsumedRef.current = true
    setOpen(true)
    onActivated?.()
  }, [activateOnMount, disabled, interactive, onActivated])

  const handleActionSelect = React.useCallback(
    (action: ComboboxActionItem) => {
      if (action.disabled) return
      action.onSelect()
      closePopup()
    },
    [closePopup]
  )

  React.useEffect(() => {
    if (!activateOnMount) {
      activationConsumedRef.current = false
    }
  }, [activateOnMount])

  React.useEffect(() => {
    if (disabled || !interactive) return
    if (!autoFocusInput && !activateOnMount) return

    const frameId = window.requestAnimationFrame(() => {
      focusInput()
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [activateOnMount, autoFocusInput, disabled, focusInput, interactive])

  const listMaxHeightStyle = React.useMemo<React.CSSProperties | undefined>(() => {
    if (actions.length === 0) return undefined

    const reservedActionHeight =
      actions.length * 36 + (options.length > 0 ? 12 : 4)

    return {
      maxHeight: `max(0px, min(calc(24rem - ${reservedActionHeight}px), calc(var(--available-height) - ${reservedActionHeight}px)))`,
    }
  }, [actions.length, options.length])

  return (
    <ComboboxRoot<unknown>
      disabled={disabled}
      open={disabled || !interactive ? false : open}
      value={value}
      items={options}
      mode={externalFilter ? "none" : autocompleteMode}
      onOpenChange={(nextOpen) => {
        if (!interactive) return
        handleOpenChange(nextOpen)
      }}
      onItemHighlighted={handleItemHighlighted}
      onValueChange={handleRootValueChange}
      itemToStringValue={itemToStringLabel}
      openOnInputClick
    >
      <div
        ref={anchorRef}
        className={cn("w-full", className)}
        data-combobox-open={open ? "true" : "false"}
      >
        <ComboboxInput
          className="w-full"
          placeholder={placeholder}
          disabled={disabled}
          inputClassName={inputClassName}
          showTrigger={false}
          showClear={false}
          onFocus={(event) => {
            if (!disabled && interactive && openOnFocus) {
              setOpen(true)
            }
            onInputFocus?.(event)
          }}
          onBlur={onInputBlur}
          onClick={(event) => {
            if (!disabled && interactive) setOpen(true)
            onInputClick?.(event)
          }}
          onKeyDown={onInputKeyDown}
          onKeyDownCapture={handleInputKeyDownCapture}
          readOnly={!interactive}
          tabIndex={interactive ? undefined : -1}
          spellCheck={false}
          autoFocus={interactive ? autoFocusInput : false}
          aria-invalid={ariaInvalid}
          {...inputDataAttributes}
        >
          {endAdornment}
        </ComboboxInput>
      </div>

      <ComboboxContent
        anchor={anchorRef}
        align="start"
        sideOffset={4}
        initialFocus={false}
        finalFocus={false}
        className={contentClassName}
      >
        <ComboboxList style={listMaxHeightStyle}>
          {options.length === 0 ? (
            emptyContent ?? <ComboboxEmpty>{emptyText}</ComboboxEmpty>
          ) : (
            <ComboboxCollection>
              {(option, index) => (
                <React.Fragment
                  key={
                    getOptionKey
                      ? getOptionKey(option as T, index)
                      : `${getOptionLabel(option as T)}-${index}`
                  }
                >
                  {(() => {
                    if (!getOptionSection) return null
                    const currentSection = getOptionSection(option as T)?.trim()
                    if (!currentSection) return null
                    const previousSection =
                      index > 0 ? getOptionSection(options[index - 1] as T)?.trim() : ""
                    if (index > 0 && previousSection === currentSection) return null

                    return renderSectionLabel ? (
                      renderSectionLabel(currentSection)
                    ) : (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {currentSection}
                      </div>
                    )
                  })()}

                  <ComboboxItem
                    value={option}
                    showIndicator={showOptionIndicator}
                  >
                    {renderOption
                      ? renderOption(option as T, false, index)
                      : getOptionLabel(option as T)}
                  </ComboboxItem>
                </React.Fragment>
              )}
            </ComboboxCollection>
          )}

        </ComboboxList>
        {actions.length > 0 ? (
          <div className="relative p-1 pt-0">
            <ComboboxSeparator />
            <ComboboxGroup>
              {actions.map((action) => {
                const hasSubmenu = (action.items?.length ?? 0) > 0
                const isSubmenuOpen = openActionKey === action.key
                const actionIconPosition = action.iconPosition ?? "start"

                return (
                  <div
                    key={action.key}
                    className="relative overflow-visible"
                    onMouseEnter={() => {
                      if (!hasSubmenu || action.disabled) return
                      setOpenActionKey(action.key)
                    }}
                    onMouseLeave={() => {
                      if (!hasSubmenu) return
                      setOpenActionKey((current) =>
                        current === action.key ? null : current
                      )
                    }}
                    onBlur={(event) => {
                      if (!hasSubmenu) return
                      const nextFocusedElement = event.relatedTarget
                      if (
                        nextFocusedElement instanceof Node &&
                        event.currentTarget.contains(nextFocusedElement)
                      ) {
                        return
                      }
                      setOpenActionKey((current) =>
                        current === action.key ? null : current
                      )
                    }}
                  >
                    <button
                      ref={(node) => setActionButtonRef(action.key, node)}
                      type="button"
                      disabled={action.disabled}
                      data-disabled={action.disabled ? "" : undefined}
                      data-state={isSubmenuOpen ? "open" : "closed"}
                      aria-haspopup={hasSubmenu ? "menu" : undefined}
                      aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onKeyDown={(event) => {
                        const actionIndex = enabledActionKeys.findIndex(
                          (actionKey) => actionKey === action.key
                        )
                        if (event.key === "ArrowDown") {
                          event.preventDefault()
                          focusActionButtonAtIndex(actionIndex + 1)
                          return
                        }
                        if (event.key === "ArrowUp") {
                          event.preventDefault()
                          focusActionButtonAtIndex(actionIndex - 1)
                          return
                        }
                        if (!hasSubmenu) return
                        if (
                          event.key === "ArrowRight" ||
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault()
                          if (!action.disabled) {
                            openSubmenuAndFocusFirstItem(action.key)
                          }
                          return
                        }
                        if (event.key === "ArrowLeft" || event.key === "Escape") {
                          event.preventDefault()
                          setOpenActionKey(null)
                        }
                      }}
                      onClick={() => {
                        if (hasSubmenu) {
                          if (action.disabled) return
                          setOpenActionKey((current) =>
                            current === action.key ? null : action.key
                          )
                          return
                        }
                        if (!action.onSelect) return
                        handleActionSelect({
                          key: action.key,
                          label: action.label,
                          icon: action.icon,
                          disabled: action.disabled,
                          onSelect: action.onSelect,
                        })
                      }}
                      className={cn(
                        hasSubmenu ? menuSubTriggerClassName : menuItemClassName,
                        menuItemInteractiveClassName,
                        "w-full"
                      )}
                    >
                      {actionIconPosition === "start" ? (
                        <ComboboxActionIcon icon={action.icon} />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate text-left">
                        {action.label}
                      </span>
                      {hasSubmenu ? <ChevronRightIcon className="ml-auto" /> : null}
                      {!hasSubmenu && actionIconPosition === "end" ? (
                        <ComboboxActionIcon icon={action.icon} className="ml-auto" />
                      ) : null}
                    </button>

                    {hasSubmenu && isSubmenuOpen ? (
                      <div
                        role="menu"
                        className={cn(
                          menuSubContentSurfaceClassName,
                          "absolute left-[calc(100%-0.125rem)] top-0 z-10 min-w-[12rem]"
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {action.items?.map((subAction) => {
                          const subActionIconPosition =
                            subAction.iconPosition ?? "start"

                          return (
                            <React.Fragment key={subAction.key}>
                              {subAction.separatorAbove ? (
                                <div className="my-1 h-px bg-border" />
                              ) : null}
                              <button
                                ref={(node) => setActionSubButtonRef(action.key, subAction.key, node)}
                                type="button"
                                disabled={subAction.disabled}
                                data-disabled={subAction.disabled ? "" : undefined}
                                onClick={() => handleActionSelect(subAction)}
                                onKeyDown={(event) => {
                                  const enabledSubActionKeys = getEnabledSubActionKeys(action.key)
                                  const subActionIndex = enabledSubActionKeys.findIndex(
                                    (subActionKey) => subActionKey === subAction.key
                                  )
                                  if (event.key === "ArrowDown") {
                                    event.preventDefault()
                                    focusSubActionButtonAtIndex(action.key, subActionIndex + 1)
                                    return
                                  }
                                  if (event.key === "ArrowUp") {
                                    event.preventDefault()
                                    focusSubActionButtonAtIndex(action.key, subActionIndex - 1)
                                    return
                                  }
                                  if (
                                    event.key === "ArrowLeft" ||
                                    event.key === "Escape"
                                  ) {
                                    event.preventDefault()
                                    closeSubmenuAndFocusAction(action.key)
                                  }
                                }}
                                className={cn(
                                  menuItemClassName,
                                  menuItemInteractiveClassName,
                                  "w-full"
                                )}
                              >
                                {subActionIconPosition === "start" ? (
                                  <ComboboxActionIcon icon={subAction.icon} />
                                ) : null}
                                <span className="min-w-0 flex-1 truncate text-left">
                                  {subAction.label}
                                </span>
                                {subActionIconPosition === "end" ? (
                                  <ComboboxActionIcon
                                    icon={subAction.icon}
                                    className="ml-auto"
                                  />
                                ) : null}
                              </button>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </ComboboxGroup>
          </div>
        ) : null}
      </ComboboxContent>
    </ComboboxRoot>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-visible rounded-md border bg-popover text-popover-foreground shadow-md duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "max-h-[min(calc(--spacing(96)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto p-1 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  showIndicator = true,
  ...props
}: ComboboxPrimitive.Item.Props & {
  showIndicator?: boolean
}) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-start gap-2 rounded-sm py-1.5 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        showIndicator ? "pr-8" : "pr-2",
        className
      )}
      {...props}
    >
      {children}
      {showIndicator ? (
        <LegacyComboboxPrimitive.ItemIndicator
          data-slot="combobox-item-indicator"
          render={
            <span className="pointer-events-none absolute right-2 top-2.5 flex size-4 items-center justify-center" />
          }
        >
          <CheckIcon className="pointer-events-none size-4 pointer-coarse:size-5" />
        </LegacyComboboxPrimitive.ItemIndicator>
      ) : null}
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 text-xs text-muted-foreground pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm",
        className
      )}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof LegacyComboboxPrimitive.Chips> &
  LegacyComboboxPrimitive.Chips.Props) {
  return (
    <LegacyComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent bg-clip-padding px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1.5 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: LegacyComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  return (
    <LegacyComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <LegacyComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </LegacyComboboxPrimitive.ChipRemove>
      )}
    </LegacyComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  children,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}

export type { ComboboxAction }
