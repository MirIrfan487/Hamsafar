namespace Matrimony.Api.Models;

// Enums are stored in the database as text (e.g. "Daughter"), so the tables stay readable.

public enum ProfileFor
{
    Self,
    Son,
    Daughter,
    Brother,
    Sister,
    Relative
}

public enum Gender
{
    Male,
    Female
}

public enum MaritalStatus
{
    NeverMarried,
    Divorced,
    Widowed
}

public enum Sect
{
    Sunni,
    Shia,
    JustMuslim,
    Other
}

public enum Religiosity
{
    VeryPracticing,
    Practicing,
    ModeratelyPracticing,
    NotPracticing
}

// Who can see this profile's photos. Photos are NEVER public to visitors who are not logged in.
public enum PhotoPrivacy
{
    AllMembers,            // any logged-in member
    AcceptedInterestsOnly, // only people whose interest this user accepted
    Hidden                 // nobody
}

// A profile only appears in search after an admin approves it.
public enum ProfileStatus
{
    Draft,
    PendingApproval,
    Approved,
    Rejected
}

public enum PhotoStatus
{
    Pending,
    Approved,
    Rejected
}

public enum InterestStatus
{
    Pending,
    Accepted,
    Rejected,
    Withdrawn
}

public enum SubscriptionStatus
{
    Active,
    Expired,
    Cancelled
}

public enum PaymentStatus
{
    Created,  // Razorpay order created, user has not paid yet
    Paid,     // payment verified on the SERVER (signature checked)
    Failed
}

public enum ReportReason
{
    FakeProfile,
    Harassment,
    InappropriatePhoto,
    ScamOrMoneyRequest,
    AlreadyMarried,
    Other
}

public enum ReportStatus
{
    Open,
    ActionTaken,
    Dismissed
}
