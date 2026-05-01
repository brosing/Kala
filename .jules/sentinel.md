## 2024-05-22 - Path Traversal via Unsanitized User Input in Directory Names
**Vulnerability:** The application used the user's display name directly as a directory name for storing photos (`photos/${username}/`). This allowed path traversal attacks (e.g., naming a user `../../etc`) to potentially access or write files outside the intended directory.
**Learning:** Using user-controlled input for file system paths is dangerous, even in local-only apps. The assumption that "users are trusted" or "it's just a name" can lead to filesystem corruption or data leakage.
**Prevention:** Always sanitize or hash user inputs before using them in file paths. Ideally, use internal IDs (e.g., `user_${uuid}`) for directory names instead of display names, maintaining a mapping if necessary.

## 2024-05-23 - Insecure Randomness in ID Generation
**Vulnerability:** The application used `Math.random()` to generate IDs for photos (`${Date.now()}_${Math.random()}`). `Math.random()` is not cryptographically secure and can be predictable, potentially leading to ID collisions or predictability if an attacker can guess the timestamp.
**Learning:** `Math.random()` should never be used for security-sensitive identifiers or when uniqueness is critical and predictability is a concern.
**Prevention:** Use `expo-crypto`'s `randomUUID()` (or `uuid` library) for generating unique identifiers. This ensures cryptographic randomness and significantly reduces collision probability.

## 2024-05-24 - Path Traversal in File Operations via Date Parameter
**Vulnerability:** The `savePhoto` function constructed filenames using an unvalidated `date` parameter (`${date}_${timestamp}.jpg`). This allowed path traversal (e.g., `../../etc/passwd`) to write files outside the intended directory. Similarly, `deletePhoto` accepted raw filenames without validation.
**Learning:** Even if the directory path is sanitized (e.g. user folder), parameters used to construct filenames within that directory must also be validated to prevent traversal back up the tree.
**Prevention:** Strictly validate all inputs used in file path construction. Enforce allowlists (e.g. `YYYY-MM-DD` for dates) and denylists (no `..`, `/`, `\`) for filenames.

## 2024-05-25 - Stored XSS via HTML in Markdown Exports
**Vulnerability:** The application exported user notes directly into Markdown files without sanitization. Since notes are stored as HTML (from a rich text editor), malicious scripts could be injected and executed if the exported file was opened in an HTML-enabled Markdown viewer.
**Learning:** Even in "offline" or "local-only" apps, data export features can be a vector for Stored XSS if the data format (like Markdown) supports embedded HTML/scripts and the viewer is permissive.
**Prevention:** Sanitize all user-generated content before exporting. When converting between formats (HTML -> Markdown), strip unsafe tags and attributes to ensure the output is safe text or safe markup, not executable code.

## 2024-05-27 - Predictable Timestamp-based IDs for Users and Sections
**Vulnerability:** User and Section IDs were generated using `user_${Date.now()}` and `section_${Date.now()}` respectively. This predictable generation pattern could lead to collisions in high-concurrency scenarios (e.g., scripted creation) and lacks cryptographic randomness.
**Learning:** Consistent ID generation strategy is crucial. Mixing timestamp-based IDs with UUIDs creates an inconsistent security posture.
**Prevention:** Standardize on `Crypto.randomUUID()` for all entity ID generation across the application, ensuring uniqueness and unpredictability.

## 2025-02-18 - HTML Injection via Split Tags
**Vulnerability:** `htmlToMarkdown` function was vulnerable to HTML injection using split tags like `<<script></script>img ...>`. The parser would strip the inner `<script>` but leave the outer characters, which then formed a valid HTML tag.
**Learning:** Simple streaming parsers (like `htmlparser2`) process input linearly. If sanitization logic (stripping tags) relies solely on tag open/close events without handling nested structures or escaping the output, attackers can reconstruct tags using the stripped parts.
**Prevention:** Always escape special characters (like `<` and `>`) in the text content of the output when converting or sanitizing HTML, to ensure that any reconstructed tags are rendered as safe text.

## 2025-02-18 - Path Traversal via Unsanitized Dot User Directory Name
**Vulnerability:** The application prevented `..` but allowed the exact user name `.`. Deleting a user named `.` would cause `FileSystem.deleteAsync` to delete `photos/./`, which resolves to deleting the entire `photos/` directory, causing data loss for all users.
**Learning:** Preventing `..` is not enough to stop path traversal and path manipulation logic flaws. The `.` (current directory) notation must also be specifically forbidden when directory names are derived from user input.
**Prevention:** Broadly prevent single dots `.` in addition to `..` in user input when generating directory structures, or better, use UUIDs as folder names rather than sanitized usernames.
## 2025-02-28 - Path Traversal vs Legacy Usernames Mutation
**Vulnerability:** Adding strict defense-in-depth sanitization for `.` and `..` traversal strings in `getPhotosDir` involved a global `trim()` that unintentionally mutated legitimate legacy usernames containing trailing spaces (e.g., `"John "`), causing a functional regression that disconnected users from their saved photos.
**Learning:** Security updates (especially those affecting critical path resolution or auth) must handle legacy data gracefully. Do not mutate an existing identifier's value (via operations like `trim()`) for *all* cases if the mutation changes how existing, legitimate data maps to the filesystem.
**Prevention:** Apply string manipulations like `trim()` only for the purpose of conditional checks (e.g., identifying exact `.` or `..` edge cases), but retain and use the original, untrimmed identifier to build paths or keys for regular resolution.
## 2024-05-28 - Path Traversal via Unvalidated Date Key in Export System
**Vulnerability:** The `prepareExport` function constructed directory and file paths using the `date` key from the `monthEntriesArr` object without validation. A malicious date string like `../../etc/passwd` could traverse directories and write files outside the intended export folder.
**Learning:** Object keys representing data fields (like dates) can be manipulated if the data source is untrusted or compromised. Even if a field is expected to be a date format, it must be validated or sanitized before being used in file system operations.
**Prevention:** Always sanitize or validate all variables used in path construction, regardless of their semantic meaning or source. For filenames and directory names, replace illegal or traversal characters (`/`, `\`, `..`, etc.) with safe alternatives.

## 2025-02-28 - Unvalidated Date Keys in Data Access Methods
**Vulnerability:** The `getEntry` and `deleteEntry` methods in `StorageService` (`services/storage.ts`) accepted a `date` string parameter without validation. This string was subsequently split and used to query the underlying storage or manipulate arrays. Unvalidated data keys can lead to application errors or be leveraged in other contexts (e.g., path traversal if the date is used in file operations elsewhere without secondary validation).
**Learning:** All input parameters, even those used internally as lookup keys (like `date`), must be strictly validated at the point of entry into the service layer to prevent malformed data from causing unexpected behavior or being propagated to more sensitive operations.
**Prevention:** In `StorageService`, data access methods such as `getEntry` and `deleteEntry` must explicitly call `this.validateDateString(date)` to ensure the input conforms to the expected `YYYY-MM-DD` format before processing.

## 2025-02-28 - Unvalidated Year and Month Integer Parameters
**Vulnerability:** Methods accessing bulk entries via AsyncStorage (`getEntriesForMonth`, `getEntriesForMonths`, `getEntriesForYear`) accepted unvalidated `year` and `month` integer parameters. A malicious or malformed input (e.g., fractional numbers, out-of-bounds dates, strings masquerading as numbers via `any` typing) could result in unexpected storage keys like `@daily_entries_100.5_13` or `@daily_entries_../../etc_NaN`, leading to corrupted state, logic bypasses, or data leakage.
**Learning:** Defense in depth requires validating not just strings, but ensuring primitive types like numbers strictly adhere to their intended constraints (e.g., integer, positive, within reasonable bounds) before they are used to construct storage or file paths.
**Prevention:** In `StorageService`, explicitly validate numeric parameters used for key generation by ensuring they are integers and fall within acceptable ranges (`year >= 1000 && year <= 9999`, `month >= 0 && month <= 11`) using a helper like `this.validateYearMonth(year, month)`.
