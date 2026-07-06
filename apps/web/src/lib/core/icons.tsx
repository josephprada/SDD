import {
	Archive,
	ArrowDownUp,
	ArrowRight,
	ArrowRightLeft,
	BadgeDollarSign,
	Calendar,
	ChartLine,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleAlert,
	CircleHelp,
	CircleUserRound,
	CloudUpload,
	Edit3,
	Ellipsis,
	House,
	Image,
	Landmark,
	Minus,
	Paperclip,
	Pencil,
	PiggyBank,
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
	| "chart-line"
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
	| "circle-help"
	| "badge-dollar-sign"
	| "landmark"
	| "piggy-bank";

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
	"chart-line": ChartLine,
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
	"circle-help": CircleHelp,
	"badge-dollar-sign": BadgeDollarSign,
	landmark: Landmark,
	"piggy-bank": PiggyBank,
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
