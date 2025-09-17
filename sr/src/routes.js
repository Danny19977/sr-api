// Import components used in routes
import Maps from "views/Maps.js";
import Country from "views/Country.js";
import Province from "views/Province.js";
import Area from "views/Area.js";
import User from "views/User.js";
import UserLogs from "views/UserLogs.js";
import Account from "views/Account.js";

// Import form management components
import FormBuilder from "views/FormBuilder.js";
import FormSubmissions from "views/FormSubmissions.js";
import FormOptions from "views/FormOptions.js";

const dashboardRoutes = [
  // ...existing code...
  // DASHBOARD SECTION
  {
    heading: true,
    name: "DASHBOARD",
    icon: "nc-icon nc-tv-2",
    section: "dashboard"
  },
  // ...existing code...
  {
    path: "/map",
    name: "Map",
    icon: "nc-icon nc-pin-3",
    component: Maps,
    layout: "/admin",
    section: "dashboard"
  },
  
  // TERRITORIES SECTION
  {
    heading: true,
    name: "TERRITORIES",
    icon: "nc-icon nc-world-2",
    section: "territories"
  },
  {
    path: "/country",
    name: "Country",
    icon: "fas fa-flag",
    component: Country,
    layout: "/admin",
    section: "territories"
  },
  {
    path: "/province",
    name: "Province",
    icon: "nc-icon nc-map-big",
    component: Province,
    layout: "/admin",
    section: "territories"
  },
  {
    path: "/area",
    name: "Area",
    icon: "nc-icon nc-square-pin",
    component: Area,
    layout: "/admin",
    section: "territories"
  },
  
  // FORM MANAGEMENT SECTION
  {
    heading: true,
    name: "FORMS",
    icon: "nc-icon nc-paper",
    section: "forms"
  },
  {
    path: "/form-builder",
    name: "Form Builder",
    icon: "nc-icon nc-ruler-pencil",
    component: FormBuilder,
    layout: "/admin",
    section: "forms"
  },
  {
    path: "/form-submissions",
    name: "Form Submissions",
    icon: "nc-icon nc-single-copy-04",
    component: FormSubmissions,
    layout: "/admin",
    section: "forms"
  },
  {
    path: "/form-options",
    name: "Form Options",
    icon: "fas fa-cog",
    component: FormOptions,
    layout: "/admin",
    section: "forms"
  },
  
  // ACTIVITIES SECTION
  // ...existing code...
  // ...existing code...
  
  // MANAGEMENT SECTION
  {
    heading: true,
    name: "MANAGER",
    icon: "nc-icon nc-badge",
    section: "management"
  },
  {
    path: "/user",
    name: "User",
    icon: "nc-icon nc-single-02",
    component: User,
    layout: "/admin",
    section: "management"
  },
  {
    path: "/user-logs",
    name: "User Logs",
    icon: "nc-icon nc-single-02",
    component: UserLogs,
    layout: "/admin",
    section: "management"
  },
    {
      path: "/account",
      name: "Account",
      icon: "fa fa-user-circle", // FontAwesome profile icon
      component: Account,
      layout: "/admin",
      section: "management"
    },
  
  // TESTING SECTION
  // ...existing code...
];

export default dashboardRoutes;
