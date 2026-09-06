/** Capability examples owned by website design; client results remain CMS-owned. */
export interface IndustryWorkflow {
  title: string;
  record: string;
  steps: { label: string; before: string; after: string }[];
}
const flow = (
  title: string,
  record: string,
  steps: [string, string, string][],
): IndustryWorkflow => ({
  title,
  record,
  steps: steps.map(([label, before, after]) => ({ label, before, after })),
});
export const industryWorkflows: Record<string, IndustryWorkflow> = {
  "retail-ecommerce-software": flow(
    "From order to fulfilment",
    "Orders, stock and fulfilment",
    [
      [
        "Order received",
        "Online and till orders sit apart",
        "Orders enter one shared queue",
      ],
      [
        "Stock checked",
        "Staff call to confirm availability",
        "Availability follows the order",
      ],
      [
        "Order fulfilled",
        "Dispatch updates are entered again",
        "Delivery status stays with the order",
      ],
    ],
  ),
  "education-software": flow(
    "From enrolment to term report",
    "Student records across the school",
    [
      [
        "Student enrolled",
        "Details repeated across registers",
        "One student record created",
      ],
      [
        "Term managed",
        "Fees and attendance tracked apart",
        "Fees and attendance linked",
      ],
      [
        "Progress shared",
        "Reports assembled by hand",
        "Staff and parents see current records",
      ],
    ],
  ),
  "healthcare-software": flow(
    "From appointment to follow-up",
    "The patient care journey",
    [
      [
        "Patient registered",
        "Paper files searched at reception",
        "Authorised staff can access the patient record",
      ],
      [
        "Care coordinated",
        "Teams pass separate notes",
        "Care notes stay with the visit",
      ],
      [
        "Follow-up arranged",
        "Bookings and billing reconciled later",
        "Appointments and billing connected",
      ],
    ],
  ),
  "hospitality-software": flow(
    "From reservation to check-out",
    "Bookings, rooms and guest service",
    [
      [
        "Booking received",
        "Channels checked separately",
        "Reservations share room availability",
      ],
      [
        "Guest welcomed",
        "Reception calls for room status",
        "Reception sees housekeeping updates",
      ],
      [
        "Stay completed",
        "Charges gathered from separate records",
        "Guest charges stay with the booking",
      ],
    ],
  ),
  "restaurant-software": flow(
    "From order to service",
    "The counter, kitchen and stockroom",
    [
      [
        "Order taken",
        "Tickets copied or called out",
        "The order goes to the kitchen",
      ],
      [
        "Kitchen prepares",
        "Staff chase preparation updates",
        "Preparation status is shared",
      ],
      [
        "Service completed",
        "Sales and stock counted separately",
        "Sales connect to stock records",
      ],
    ],
  ),
  "real-estate-software": flow(
    "From enquiry to signed keys",
    "The property and client record",
    [
      [
        "Enquiry received",
        "Leads spread across messages",
        "Enquiries collected in one pipeline",
      ],
      [
        "Viewing arranged",
        "Staff coordinate diaries manually",
        "Viewings linked to the property",
      ],
      [
        "Agreement managed",
        "Documents and payments kept apart",
        "Agreements and payments linked",
      ],
    ],
  ),
  "logistics-software": flow(
    "From dispatch to delivery",
    "Each vehicle and delivery",
    [
      [
        "Delivery assigned",
        "Jobs relayed through calls",
        "Jobs assigned in a shared dispatch view",
      ],
      [
        "Journey tracked",
        "Dispatchers call for location",
        "Vehicle updates inform dispatch",
      ],
      [
        "Delivery confirmed",
        "Paper proof returns later",
        "Delivery evidence stays with the job",
      ],
    ],
  ),
  "fintech-software": flow(
    "From onboarding to reconciliation",
    "Customers, controls and transactions",
    [
      [
        "Customer onboarded",
        "Verification records sit apart",
        "Checks follow the customer record",
      ],
      [
        "Transaction reviewed",
        "Exceptions tracked in spreadsheets",
        "Exceptions enter a review queue",
      ],
      [
        "Records reconciled",
        "Teams compare separate exports",
        "Reconciliation has a traceable record",
      ],
    ],
  ),
  "insurance-software": flow(
    "From claim to resolution",
    "The policy and claim history",
    [
      [
        "Claim received",
        "Forms and evidence arrive separately",
        "Evidence linked to the claim",
      ],
      [
        "Assessment coordinated",
        "Teams chase outstanding documents",
        "Reviewers see the claim's next step",
      ],
      [
        "Resolution recorded",
        "Updates repeated across systems",
        "Decisions stay with the policy record",
      ],
    ],
  ),
  "manufacturing-software": flow(
    "From production plan to output",
    "Production and equipment condition",
    [
      [
        "Work scheduled",
        "Plans spread across shift sheets",
        "Teams share the production plan",
      ],
      [
        "Equipment monitored",
        "Problems reported after disruption",
        "Equipment signals support early review",
      ],
      [
        "Output reviewed",
        "Shift totals compiled after the fact",
        "Production records feed the same view",
      ],
    ],
  ),
  "agritech-software": flow(
    "From field observation to action",
    "Field conditions and farm operations",
    [
      [
        "Field checked",
        "Observations kept in separate notes",
        "Field observations captured together",
      ],
      [
        "Work planned",
        "Conditions and tasks considered apart",
        "Field data informs the work plan",
      ],
      [
        "Harvest recorded",
        "Yield records reconciled later",
        "Harvest records linked to the field",
      ],
    ],
  ),
  "professional-services-software": flow(
    "From client brief to billing",
    "The client, work and billable time",
    [
      [
        "Work opened",
        "Briefs and files scattered across inboxes",
        "The client brief anchors the work",
      ],
      [
        "Time captured",
        "Hours reconstructed at month-end",
        "Time linked to the relevant project",
      ],
      [
        "Client billed",
        "Invoices assembled from separate sheets",
        "Recorded work informs billing",
      ],
    ],
  ),
  "church-management-software": flow(
    "From member record to ministry",
    "Members, activities and administration",
    [
      [
        "Member welcomed",
        "Details repeated across paper lists",
        "One member record maintained",
      ],
      [
        "Activities coordinated",
        "Teams maintain separate schedules",
        "Groups and events share a calendar",
      ],
      [
        "Administration reviewed",
        "Reports assembled from many registers",
        "Authorised teams use shared records",
      ],
    ],
  ),
  "ngo-software": flow(
    "From field activity to donor report",
    "Programme delivery and evidence",
    [
      [
        "Activity recorded",
        "Field notes wait for re-entry",
        "Field records captured at source",
      ],
      [
        "Evidence reviewed",
        "Files separated from programme records",
        "Evidence linked to each activity",
      ],
      [
        "Progress reported",
        "Reports rebuilt from spreadsheets",
        "Programme records support reporting",
      ],
    ],
  ),
  "government-digital-solutions": flow(
    "From application to public service",
    "The citizen's service request",
    [
      [
        "Request submitted",
        "Paper forms move between desks",
        "Applications enter one service queue",
      ],
      [
        "Review coordinated",
        "Citizens return to ask for updates",
        "Teams track the request's next step",
      ],
      [
        "Service completed",
        "Approvals and receipts filed separately",
        "Decisions remain with the request",
      ],
    ],
  ),
  "construction-software": flow(
    "From site update to project decision",
    "Site progress, resources and costs",
    [
      [
        "Site update captured",
        "Updates buried in calls and messages",
        "Site updates organised by project",
      ],
      [
        "Resources reviewed",
        "Materials and labour tracked apart",
        "Resources linked to the work plan",
      ],
      [
        "Progress assessed",
        "Cost changes surface in late reports",
        "Project records support earlier review",
      ],
    ],
  ),
  "media-entertainment-software": flow(
    "From content to audience",
    "Content, distribution and engagement",
    [
      [
        "Content organised",
        "Assets spread across drives",
        "Content organised in one library",
      ],
      [
        "Publishing coordinated",
        "Channels managed in isolation",
        "Publishing follows a shared workflow",
      ],
      [
        "Performance reviewed",
        "Audience reports gathered separately",
        "Engagement informs the next release",
      ],
    ],
  ),
  "fitness-wellness-software": flow(
    "From booking to the next visit",
    "Bookings, memberships and attendance",
    [
      [
        "Session booked",
        "Bookings taken through separate messages",
        "Appointments share one calendar",
      ],
      [
        "Member welcomed",
        "Staff check membership manually",
        "Membership linked to attendance",
      ],
      [
        "Next visit planned",
        "Renewals rely on manual reminders",
        "Follow-up follows the member record",
      ],
    ],
  ),
  "automotive-software": flow(
    "From vehicle check-in to handover",
    "The vehicle and workshop job",
    [
      [
        "Vehicle checked in",
        "Service history searched on paper",
        "Vehicle history linked to the job",
      ],
      [
        "Work coordinated",
        "Parts and job status tracked apart",
        "Parts and work share a job record",
      ],
      [
        "Vehicle handed over",
        "Invoices and service notes entered twice",
        "Completed work stays with the vehicle",
      ],
    ],
  ),
  "events-software": flow(
    "From ticket purchase to check-in",
    "Tickets, attendance and event reporting",
    [
      [
        "Ticket purchased",
        "Sales tracked across separate lists",
        "Ticket records collected together",
      ],
      [
        "Guest checked in",
        "Names checked against printed sheets",
        "Tickets verified at the entrance",
      ],
      [
        "Attendance reviewed",
        "Headcounts reconciled after the event",
        "Check-in records support reporting",
      ],
    ],
  ),
};
