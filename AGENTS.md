<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Backend test command
- Run specific test: `mvn test -f "C:\JavaProjects\rentmanager-backend" -Dtest="ClassName" -pl .`
- Run full suite: `mvn test -f "C:\JavaProjects\rentmanager-backend" -pl .`
- Status (2026-08-09): full suite is green — 990 tests, 0 failures, 0 errors (was previously 5 failures + 18 errors pre-existing; they no longer reproduce). Treat any new failure as caused by your change.

# Test conventions for new tests
- Do NOT use `@Mock`/`@InjectMocks`/`@ExtendWith(MockitoExtension.class)` or `@Nested` — Mockito's strict stubbing causes `UnnecessaryStubbingException` when tests override shared `@BeforeEach` stubs.
- Use manual `mock(Class.class)` construction with `@BeforeEach` only setting up repo mocks (no stubbing). Each test method creates its own domain mocks AND stubs.
- Never call `mockXxx()` helper methods inside `when(...).thenReturn(...)` arguments — this causes `UnfinishedStubbingException`. Create all domain mocks first, then set up stubbings.
<!-- END:nextjs-agent-rules -->
