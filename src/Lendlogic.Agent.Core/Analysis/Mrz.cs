namespace Lendlogic.Agent.Core.Analysis;

/// <summary>
/// ICAO 9303 MRZ check-digit validation (TD3 / passport, 2×44 lines). Deterministic,
/// no Claude. Validates the document-number, date-of-birth, expiry, and composite
/// check digits on line 2.
/// </summary>
internal static class Mrz
{
    /// <summary>
    /// Validates a full raw MRZ (one or more lines). Splits the text and, when it
    /// is a TD3 / passport layout (two 44-char lines), validates line 2's check
    /// digits. Returns null when the input is absent or not a recognised layout
    /// (nothing to check — defer to confidence + human review).
    /// </summary>
    public static bool? Validate(string? mrz)
    {
        if (string.IsNullOrWhiteSpace(mrz)) return null;

        var lines = mrz.Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        // TD3 / passport: two lines of 44 characters.
        if (lines.Length == 2 && lines[0].Length == 44 && lines[1].Length == 44)
            return ValidateTd3(lines[1]);

        return null;
    }

    /// <summary>
    /// Returns true/false when line 2 is a parseable TD3 line and its check digits
    /// validate; null when the input isn't a TD3 MRZ line (check is not applicable).
    /// </summary>
    public static bool? ValidateTd3(string? line2)
    {
        if (string.IsNullOrWhiteSpace(line2)) return null;

        var line = line2.Trim().ToUpperInvariant();
        if (line.Length != 44) return null;
        foreach (var c in line)
            if (!(char.IsDigit(c) || (c >= 'A' && c <= 'Z') || c == '<'))
                return null;

        // TD3 line 2 layout (0-indexed):
        // 0-8 doc number, 9 check; 13-18 DOB, 19 check; 21-26 expiry, 27 check; 43 composite.
        var docOk = CheckDigit(line.Substring(0, 9)) == Value(line[9]);
        var dobOk = CheckDigit(line.Substring(13, 6)) == Value(line[19]);
        var expOk = CheckDigit(line.Substring(21, 6)) == Value(line[27]);

        // Composite covers positions 0-9, 13-19, 21-42.
        var composite = line.Substring(0, 10) + line.Substring(13, 7) + line.Substring(21, 22);
        var compOk = CheckDigit(composite) == Value(line[43]);

        return docOk && dobOk && expOk && compOk;
    }

    private static int CheckDigit(string input)
    {
        int[] weights = { 7, 3, 1 };
        var sum = 0;
        for (var i = 0; i < input.Length; i++)
            sum += Value(input[i]) * weights[i % 3];
        return sum % 10;
    }

    private static int Value(char c)
    {
        if (c >= '0' && c <= '9') return c - '0';
        if (c >= 'A' && c <= 'Z') return c - 'A' + 10;
        return 0; // '<' filler
    }
}
