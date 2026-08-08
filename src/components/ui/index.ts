/**
 * Public surface of the primitive layer.
 *
 * Feature code imports from `@/components/ui` only — never from a file inside
 * it — so primitives can be refactored or re-split without touching features.
 */
export { Avatar } from './Avatar';
export { Badge, type BadgeTone } from './Badge';
export { Button, type ButtonProps, type ButtonVariant } from './Button';
export { Card, CardBody, CardFooter, CardHeader } from './Card';
export { Checkbox } from './Checkbox';
export { ConfirmDialog } from './ConfirmDialog';
export { Drawer } from './Drawer';
export { EmojiPicker } from './EmojiPicker';
export { EmptyState } from './EmptyState';
export { Field } from './Field';
export { IconButton } from './IconButton';
export { Input, Textarea } from './Input';
export { Menu, type MenuItem } from './Menu';
export { Modal } from './Modal';
export { Progress } from './Progress';
export { SegmentedControl } from './SegmentedControl';
export { SearchableSelect, type SearchableOption } from './SearchableSelect';
export { Select, type SelectOption } from './Select';
export { Skeleton, SkeletonText } from './Skeleton';
export { Switch } from './Switch';
export { Tabs, type TabItem } from './Tabs';
export { ToastProvider, useToast } from './Toast';
export { Tooltip } from './Tooltip';
