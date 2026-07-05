import { IoHomeOutline, IoAnalyticsOutline, IoSettingsOutline, IoFileTrayFullOutline, IoPeopleOutline, IoWalletOutline, IoSchoolOutline, IoNewspaperOutline } from "react-icons/io5";
import { LEARN_MODULE_ENABLED } from "@/lib/constants";

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  locked?: boolean;
}

const useSidebarLinks = (): SidebarLink[] => {
  const links: SidebarLink[] = [
    {
      title: "Home",
      path: "/dashboard",
      icon: IoHomeOutline
    },
    {
      title: "Analytics",
      path: "/analytics",
      icon: IoAnalyticsOutline
    },
    {
      title: "Trades",
      path: "/trades",
      icon: IoFileTrayFullOutline
    },
    {
      title: "Accounts",
      path: "/accounts",
      icon: IoWalletOutline
    },
    {
      title: "News",
      path: "/news",
      icon: IoNewspaperOutline
    },
    {
      title: "Learn",
      path: "/learn",
      icon: IoSchoolOutline,
      locked: !LEARN_MODULE_ENABLED
    },
    {
      title: "Community",
      path: "/community",
      icon: IoPeopleOutline
    },
    {
      title: "Settings",
      path: "/settings/information",
      icon: IoSettingsOutline
    },
  ];

  return links;
};

export default useSidebarLinks;
