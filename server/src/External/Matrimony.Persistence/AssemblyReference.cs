using System.Reflection;

namespace Matrimony.Persistence;

// Points to this project's assembly (the compiled .dll).
// Program.cs uses it to find and register Persistence services automatically.
public static class AssemblyReference
{
    public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
}
