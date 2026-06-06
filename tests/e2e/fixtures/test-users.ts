export type TestUserRole = "employee" | "manager" | "admin";

export type JobRole =
  | "line_cook"
  | "hostess"
  | "server"
  | "bartender"
  | "food_runner"
  | "dishwasher"
  | "prep_cook"
  | "supervisor"
  | "new_manager";

export interface TestUserFixture {
  slug: string;
  email: string;
  password: string;
  fullName: string;
  role: TestUserRole;
  jobRole: JobRole | null;
  outletId: string;
  outletName: string;
  expectedCourseTitle: string;
}

export const TEST_PASSWORD = "TestPass!2026";

export const OUTLETS = {
  mesaVerde: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Mesa Verde Cantina",
    courseTitle: "Server Training — Mesa Verde Cantina",
  },
  altitudeBurger: {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Altitude Burger Co.",
    courseTitle: "Server Training — Altitude Burger Co.",
  },
  rockyBrew: {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Rocky Brew Coffee",
    courseTitle: "Server Training — Rocky Brew Coffee",
  },
} as const;

function mk(
  slug: string,
  fullName: string,
  role: TestUserRole,
  jobRole: JobRole | null,
  outlet: typeof OUTLETS[keyof typeof OUTLETS],
): TestUserFixture {
  return {
    slug,
    email: `test+${slug}@skyportco.test`,
    password: TEST_PASSWORD,
    fullName,
    role,
    jobRole,
    outletId: outlet.id,
    outletName: outlet.name,
    expectedCourseTitle: outlet.courseTitle,
  };
}

export const TEST_USERS: TestUserFixture[] = [
  // Mesa Verde Cantina — front of house + manager
  mk("server", "Test Server", "employee", "server", OUTLETS.mesaVerde),
  mk("hostess", "Test Hostess", "employee", "hostess", OUTLETS.mesaVerde),
  mk("bartender", "Test Bartender", "employee", "bartender", OUTLETS.mesaVerde),
  mk("manager", "Test Manager", "manager", null, OUTLETS.mesaVerde),

  // Altitude Burger Co. — back of house
  mk("linecook", "Test Line Cook", "employee", "line_cook", OUTLETS.altitudeBurger),
  mk("prepcook", "Test Prep Cook", "employee", "prep_cook", OUTLETS.altitudeBurger),
  mk("dishwasher", "Test Dishwasher", "employee", "dishwasher", OUTLETS.altitudeBurger),
  mk("foodrunner", "Test Food Runner", "employee", "food_runner", OUTLETS.altitudeBurger),

  // Rocky Brew Coffee — leadership
  mk("supervisor", "Test Supervisor", "employee", "supervisor", OUTLETS.rockyBrew),
  mk("newmanager", "Test New Manager", "employee", "new_manager", OUTLETS.rockyBrew),
  mk("admin", "Test Admin", "admin", null, OUTLETS.rockyBrew),
];