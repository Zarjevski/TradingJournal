import { IoHomeOutline, IoAnalyticsOutline, IoSettingsOutline, IoFileTrayFullOutline, IoPeopleOutline } from "react-icons/io5";

interface SidebarLink {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const useSidebarLinks = (): SidebarLink[] => {
  const links: SidebarLink[] = [
    {
      title: "Home",
      path: "/",
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
      title: "Team",
      path: "/team",
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
