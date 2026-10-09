/**
 * Modern Skeleton component with shimmer animation for loading placeholders.
 * @param {object} props
 * @param {'text'|'circular'|'rectangular'|'rounded'} [props.variant='rounded']
 * @param {string|number} [props.width]
 * @param {string|number} [props.height]
 * @param {string|number} [props.borderRadius]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
export default function Skeleton({
  variant = 'rounded',
  width,
  height,
  borderRadius,
  className = '',
  style = {},
  ...rest
}) {
  const customStyle = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...(borderRadius !== undefined
      ? { borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius }
      : {}),
    ...style,
  };

  return (
    <div
      className={`sc-skeleton sc-skeleton-${variant} ${className}`.trim()}
      style={customStyle}
      aria-hidden="true"
      {...rest}
    />
  );
}
