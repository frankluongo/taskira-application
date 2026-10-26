# Taskira Product Requirements

## Summary

I'm using this document to describe how I want the different features of Taskira to function so that, when I pass it off to my AI Agent, it will have a better sense of what to do.

## Features

### Habits

#### Habits Summary

Habits are things I _want_ to do on a regular cadence. However, it does not actually matter to me if they are completed.

#### Habits Highlights

- Habits refresh every day whether completed or not
- No history is kept for whether habits are checked off or not
- Habits are divided up into three categories. "AM" (things I'd like to do in the morning), "Misc" (things that can be done at any point in the day) and "PM" (things I'd like to do in the morning)
- Habits should have a flexible cadence. They could be done daily, every other day, on certain days of the week, etc.
- If a reminder time is set on a habit, I should receive a notification at that time

#### Habits Examples

- "Write in my journal" — something that repeats daily
- "Write in my work journal" — something that repeats every weekday

#### Habits Open Questions

Q: The "PM" group is described as "things I'd like to do in the morning" — is that a copy/paste typo and it should read "evening/night"?

A: Yes. That is a typo on my part!

Q: For "every other day" cadence: alternating relative to what? Since no completion history is kept, there's no "last done" date to anchor to. Should it alternate off the habit's `start_date` (e.g. due on day 1, 3, 5... from start), or something else?

A: For this, show me a day selector in the UI and I will pick the days it repeats on. (Follow-up: dropping "every other day" as a distinct cadence entirely — not a hard requirement — in favor of just picking specific days via the day selector.)

Q: When a habit isn't due today (per its cadence), should it still appear in the list in a disabled/greyed state, or be hidden entirely until its next due day?

A: If a habit isn't due today, do not show it in the UI.

Q: Should the reminder notification only fire on days the habit is actually due, or every day regardless of cadence?

A: The notification should only fire on the day the habit is actually due.

Q: Habits already support optional `start_date`/`end_date`. Once `end_date` passes, should the habit auto-archive/hide, or just stop appearing without being deleted?

A: It should auto-archive/hide. (Follow-up: not recoverable — a soft-delete/one-way archive is fine, these can be fleeting.)

———

### Chores

#### Chores Summary

Chores are things I _should_ do on a regular cadence. If I do not complete a chore at a certain day/time, it should remain in an "overdo" state. It matters to me that they are completed.

#### Chores Highlights

- Chores should have a flexible cadence. They could be once a day, once a week, on certain days, once a year, etc.
- Once a chore is completed, it will be repeated on the day set when it was created (example, if the chorse "take out the trash" is set due on Monday, but I complete it on Tuesday, the next one should still be due on Monday)
- I should have the ability to categorize chores if I want
- The categories should be flexible
- I should be able to filter by category
- If a chore has a reminder time, I should receive a notification at that time

#### Chores Examples

- "Take out the trash" — something that repeats every monday, I should receive a notification at 6 PM, and it is not categorized.
- "Wish dad a happy birthday" — something that repeats annually on his birthday. It is in the "birthdays" category.

#### Chores Open Questions

Q: Chores currently belong to a single "list" (`chore_lists`), not a tag-style category. Do you want "category" to just be a rename of this existing list concept (one category per chore), or a separate, possibly multi-select tag system?

A: Let's keep this list system. I forgot about it! The chores would not be in multiple lists.

Q: Recurrence today is weekly/monthly/yearly/custom-N-days-weeks-months-years, computed off `due_date`. Weekly recurrence isn't tied to a specific weekday label — it just adds 7 days to whatever `due_date` was. Is that sufficient for something like "every Monday," or do you want an explicit day-of-week picker like Habits has?

A: This is tough. For instance, I have to take the trash out every monday because it is collected the next morning on tuesdays. So, if I forget to check it off until the next day, it's critical that it repeat the following monday again. However, something like replacing my air filter should happen 3 months after I check off that task, since that is when I replaced the filter. Is it possible to support both of these scenarios? If not, let's only do the former (trash) (Follow-up: yes — add a per-chore "Repeat from" toggle with two options, **Due date** (fixed schedule, e.g. trash) and **Completion date** (rolling, e.g. air filter). Defaults to Due date; can be switched to Completion date per chore.)

Q: You mention an "overdue" state. Is that just a visual treatment (e.g. red badge) for chores past their `due_date` and not yet completed, or should overdue chores also surface somewhere prominent, like the Today page?

A: Let's do a visual treatment _and_ put them on the today page. (Follow-up: dropped — no Today page requirement. Just the visual treatment on the chore itself.)

Q: The "complete late but next occurrence stays anchored to the original schedule" behavior — confirmed already implemented for weekly/monthly/yearly/custom cadences. Does that hold for every cadence you're imagining, including daily?

A: Daily is tough. If I make a daily chore to "do the dishes" I don't need that piling up. Is it possible to make an exception for daily? (Follow-up: yes — daily chores behave like Habits. No overdue state, no notification pressure, they just roll to today regardless of whether the previous day was completed.)

———

### Tasks

#### Tasks Summary

Tasks are one-off things that I _need_ to do.

#### Tasks Highlights

- I should be able to assign a due date/time for a task, and receive a notification on that day/time.
- Tasks should have a priority assignment (the existing 5-level Someday/Low/Medium/High/Critical scale) that I can filter by
- Currently, tasks can have a project assigned to them, but I'd like to remove that from the Tasks tab specifically (project tabs/filtering move to the new "Projects" tab; the underlying project data model stays)

#### Tasks Examples

- "Clean the stove" — is a task with a medium priority and a due date
- "Call my internet provider" is a task with a high priority

#### Tasks Open Questions

Q: Priority is currently a 5-level scale (Someday/Low/Medium/High/Critical), not the 3 levels (low/medium/high) described here. Do you want to collapse it down to 3, or keep 5 and just update this doc's wording?

A: Keep the 5 and update the doc!

Q: Tasks already have a `project_id` (defaulting to an "Inbox" project) and a `projects` table already exists in the store — the plumbing for Projects is partially there. Is the ask to remove the project picker from the plain Tasks page UI (so assignment only happens from within the new Projects tab), while keeping the underlying `project_id`/Inbox model? Or something more structural?

A: If we can reuse the existing infrastructure, I think that could suffice. So long as no task within a project shows up on the "Tasks" tab of the application, I don't mind. (Follow-up: confirmed — the project-tab scroller and per-project filtering currently in Tasks.jsx move wholesale to the new Projects page. Tasks tab is intentionally simplified down to just Inbox tasks so Projects can carry the more complex UI.)

Q: Should standalone tasks (outside Projects) ever support recurrence, or is recurrence reserved for Habits/Chores/Project-tasks only?

A: Recurrence is reserved for Habits/Chores/Project-tasks. The idea behind a task is that I only have to do it once.

Q: The `tasks` table already has a `parent_task_id` (subtasks), unused in the current UI. Is subtasking in scope for this pass, or explicitly out of scope for now?

A: We can ignore subtasks. I'd even suggest removing it. (Follow-up: leave the existing subtask functionality as-is for now — it already works, not worth tearing out. Can revisit building it out further later.)

———

### Projects\*

#### Projects Summary

\*THIS IS A NEW FEATURE. I'd like a space in the app for handling ongoing "projects." Right now, I'm building a website for a client, working on gifts for my partner, and building this application. Typically, I sit down for around an hour or two after work to tackle these projects, and would love a tab in my app called, "Projects" where I could see, at a glance, what I'm currently working on.

I'm envisioning a horizontal scrollable list of projects across the top. By default, all project-related tasks will show below this list, and I can filter them if I want.

Similar to regular tasks, tasks within a project will have a priority, and can have a due date/time to receive a notification. I would also like repeating tasks under a project (ex. "Meet with client" that repeats every friday).

Tasks within a project can be checked off/completed, and projects themselves can be checked off/completed.

#### Projects Examples

- "Import Automotive of Venice" — the name of the website I'm building for the client. Within that can be tasks like, "create header," "pick fonts/colors," etc.
- "Work on Gifts" — the project for my partner's birthday gifts. Within that could be a task that repeats every certain day that says, "work on this for an hour"

#### Projects Open Questions

Q: When a project is marked complete, what happens to its remaining incomplete tasks — auto-complete them, block the project from completing until all tasks are done, or leave them as-is (orphaned/hidden)?

A: Auto-complete them! (Follow-up: unlike regular Tasks — where "complete" currently hard-deletes the row — completed projects and their tasks should be archived/hidden rather than deleted, so they're still around to refer back to later. Recurring tasks under the project get swept up in the auto-complete and stop recurring once the project is complete.)

Q: For repeating tasks within a project (e.g., "Meet with client" every Friday), should these use the same due-date-anchored recurrence engine as Chores, or a cadence-based model like Habits (no fixed due date, just "due this week")?

A: Follow the recurrence engine from chores (Follow-up: including the "Repeat from" due-date/completion-date toggle — carries over to project tasks the same way it works for Chores.)

Q: Should the existing "Inbox" default project keep serving as the catch-all for tasks not assigned to a real project, or should every task require an explicit project once this feature ships?

A: Let's keep inbox just to make things simple. On the "Tasks" page we will display any task in that "inbox" project and hide that from the "projects" page

Q: Do project tasks use the same priority scale as regular Tasks (see Tasks open question above)?

A: Yes

Q: Can a project have its own due date/deadline (distinct from its individual tasks' due dates), or is a project just an open-ended container until manually marked complete?

A: Projects are an open-ended container

Q: For the horizontal scrollable project list — does selecting a project filter the task list below to just that project's tasks, or does it navigate to a dedicated project detail view?

A: It filters the task list below to just that project's tasks

———

### Checklists\*

#### Checklists Summary

\*THIS IS ANOTHER NEW FEATURE. I often create "checklists." They are collections of things to do.

#### Checklists Highlights

- Each Checklist has a name
- I can "reset" each checklist page easily
- It should have an "edit mode" for adding items and a "checklist mode" for checking them off so I never accidentally start editing something when I'm trying to check it off

#### Checklists Examples

- "Pre-vacation Checklist" — contains a list of items to make sure I have before going on vacation

#### Checklists Open Questions

Q: Can a user have multiple checklists at once (like Chore Lists), with some kind of picker/home view to switch between them?

A: Yes. There will definitely be multiple checklists. On the "checklists" page we will display a list of them, and selecting one will bring you to a single checklist page. In routing terms, it would be like, `/checklists`, then, `/checklists/name-of-checklist/`

Q: Does "reset" just uncheck every item, or can it also restore items that were removed/edited since the checklist was last used?

A: It will uncheck every item.

Q: Do checklist items carry any metadata beyond a name + checked state (e.g. notes, ordering, due date/notification), or are they intentionally minimal?

A: Hmm... I think it would be great to be able to divide checklists into sections. For the vacation checklist example, there could be sections for "hygiene," "technology," "clothing" etc. It could be as simple as allowing the insertion of headings to break up a checklist. (Follow-up: sections are a separate structure that items nest under — not just heading rows in a flat list. In edit mode, a section can be renamed or deleted. Items don't require a section — ungrouped/top-level items are allowed alongside sections. Items can be dragged between sections. Sections themselves can also be reordered relative to each other.)

Q: In "edit mode," can items be reordered or deleted, or only added/renamed?

A: Items can be reordered and/or deleted in edit mode.

Q: Should finishing all items (all checked) trigger anything automatically — e.g., a completion state, or prompt to reset — or is that always a manual action?

A: It is a manual action to reset.
