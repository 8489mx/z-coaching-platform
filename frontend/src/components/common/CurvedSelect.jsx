import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Drop-in replacement for a native select element (Zero Sharp Corners / No Native Dropdowns).
 * Accepts the same markup: value, onChange(e) with e.target.value, and <option> children
 * (including arrays from .map and fragments). The open list is a curved custom panel.
 */
function collectOptions(children, acc = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      collectOptions(child.props.children, acc);
      return;
    }
    if (child.type === 'option') {
      acc.push({
        value: String(child.props.value ?? ''),
        label: child.props.children,
        disabled: Boolean(child.props.disabled)
      });
    }
  });
  return acc;
}

export default function CurvedSelect({
  value,
  onChange,
  children,
  className = '',
  style,
  disabled = false,
  name,
  id,
  'aria-label': ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();

  const options = useMemo(() => collectOptions(children), [children]);
  const currentValue = String(value ?? '');
  const selectedIndex = options.findIndex((opt) => opt.value === currentValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[activeIndex];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex]);

  const commit = (opt) => {
    if (!opt || opt.disabled) return;
    setIsOpen(false);
    if (opt.value === currentValue) return;
    const target = { value: opt.value, name };
    onChange?.({ target, currentTarget: target, preventDefault() {}, stopPropagation() {} });
  };

  const moveActive = (step) => {
    if (options.length === 0) return;
    let next = activeIndex;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + step + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      else moveActive(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) commit(options[activeIndex]);
      else setIsOpen(true);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="curved-select" style={style?.width ? { width: style.width } : undefined}>
      <button
        type="button"
        id={id}
        className={`curved-select-trigger ${className}`.trim()}
        style={style}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleKeyDown}
      >
        <span className="curved-select-value">{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDown size={14} className={`curved-select-chevron${isOpen ? ' is-open' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <ul ref={listRef} id={listId} role="listbox" className="curved-select-list">
          {options.map((opt, idx) => (
            <li
              key={`${opt.value}-${idx}`}
              role="option"
              aria-selected={opt.value === currentValue}
              aria-disabled={opt.disabled || undefined}
              className={[
                'curved-select-option',
                opt.value === currentValue ? 'is-selected' : '',
                idx === activeIndex ? 'is-active' : '',
                opt.disabled ? 'is-disabled' : ''
              ].filter(Boolean).join(' ')}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
