# Security Notes for Office Processing Dependencies

## Known Vulnerabilities

### xlsx@0.18.5

The `xlsx` package version 0.18.5 (latest available on npm) has the following known security vulnerabilities:

1. **Prototype Pollution** (CVE-2023-30533)
   - Affected versions: < 0.19.3
   - Status: No patched version available on npm registry

2. **Regular Expression Denial of Service (ReDoS)** (CVE-2024-22363)
   - Affected versions: < 0.20.2
   - Status: No patched version available on npm registry

### Mitigation Options

The SheetJS maintainers no longer publish updated versions to npm. Patched versions are only available via:

1. **Official CDN** (Recommended by maintainers):
   ```bash
   pnpm add xlsx@https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
   ```

2. **Alternative packages**:
   - `exceljs` - Actively maintained, MIT licensed, full Excel support
   - `@e965/xlsx` - Community-maintained mirror with patches

### Current Status

- **Current version**: 0.18.5 (as specified in OFFICE-001)
- **Risk level**: Medium to High for untrusted input
- **Recommendation**: 
  - For production use with untrusted files, consider migrating to `exceljs`
  - For internal use with trusted files, current version is acceptable
  - Validate and sanitize all Excel file inputs
  - Monitor for npm registry updates or consider CDN version

### References

- [SheetJS Security Advisory](https://cdn.sheetjs.com/advisories/CVE-2024-22363)
- [GitHub Issue #2831](https://github.com/SheetJS/sheetjs/issues/2831)
- [GitLab Advisory Database](https://advisories.gitlab.com/pkg/npm/xlsx/)

---

**Last Updated**: 2025-12-11
**Reviewed By**: Copilot AI
