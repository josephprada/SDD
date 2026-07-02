import {
	Archive,
	ArrowDownUp,
	ArrowRight,
	ArrowRightLeft,
	BadgeDollarSign,
	Calendar,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleAlert,
	CircleUserRound,
	CloudUpload,
	Edit3,
	Ellipsis,
	House,
	Image,
	Minus,
	Paperclip,
	Pencil,
	Plus,
	Search,
	SearchX,
	Settings,
	SlidersHorizontal,
	Tag,
	Tags,
	Trash2,
	Wallet,
	X,
	type LucideIcon,
} from "lucide-react";

export type CoreIconName =
	| "house"
	| "arrow-down-up"
	| "wallet"
	| "tags"
	| "tag"
	| "settings"
	| "ellipsis"
	| "plus"
	| "minus"
	| "trash"
	| "edit"
	| "pencil"
	| "paperclip"
	| "calendar"
	| "chevron-left"
	| "chevron-right"
	| "chevron-down"
	| "arrow-right-left"
	| "arrow-right"
	| "circle-user-round"
	| "search"
	| "search-x"
	| "sliders-horizontal"
	| "image"
	| "x"
	| "cloud-upload"
	| "archive"
	| "circle-alert"
	| "badge-dollar-sign";

const iconMap: Record<CoreIconName, LucideIcon> = {
	house: House,
	"arrow-down-up": ArrowDownUp,
	wallet: Wallet,
	tags: Tags,
	tag: Tag,
	settings: Settings,
	ellipsis: Ellipsis,
	plus: Plus,
	minus: Minus,
	trash: Trash2,
	edit: Edit3,
	pencil: Pencil,
	paperclip: Paperclip,
	calendar: Calendar,
	"chevron-left": ChevronLeft,
	"chevron-right": ChevronRight,
	"chevron-down": ChevronDown,
	"arrow-right-left": ArrowRightLeft,
	"arrow-right": ArrowRight,
	"circle-user-round": CircleUserRound,
	search: Search,
	"search-x": SearchX,
	"sliders-horizontal": SlidersHorizontal,
	image: Image,
	x: X,
	"cloud-upload": CloudUpload,
	archive: Archive,
	"circle-alert": CircleAlert,
	"badge-dollar-sign": BadgeDollarSign,
};

type IconProps = {
	size?: number;
	className?: string;
	strokeWidth?: number;
};

export function CoreIcon({
	name,
	size = 22,
	className = "",
	strokeWidth = 2,
}: {
	name: CoreIconName;
} & IconProps) {
	const Icon = iconMap[name];
	return (
		<Icon
			size={size}
			className={className}
			strokeWidth={strokeWidth}
			aria-hidden
		/>
	);
}

export const ACCOUNT_TYPE_LABELS = {
	cash: "Efectivo",
	bank: "Banco",
	credit: "Crédito",
} as const;

export const TRANSACTION_TYPE_LABELS = {
	income: "Ingreso",
	expense: "Gasto",
	transfer: "Transferencia",
} as const;
