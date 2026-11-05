using System.Reflection;

namespace Matrimony.Application;

// Points to this project's assembly (the compiled .dll).
// Program.cs uses it to find and register the Application services (AuthService, ProfileService, ...) automatically.
public static class AssemblyReference
{
    public static readonly Assembly Assembly = typeof(AssemblyReference).Assembly;
}
