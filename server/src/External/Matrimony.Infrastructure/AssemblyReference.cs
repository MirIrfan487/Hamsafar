using System.Reflection;

namespace Matrimony.Infrastructure;

// Points to this project's assembly (the compiled .dll).
// Program.cs uses it to find and register Infrastructure services (TokenService, ...) automatically.
public static class AssemblyReference
{
    public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
}
