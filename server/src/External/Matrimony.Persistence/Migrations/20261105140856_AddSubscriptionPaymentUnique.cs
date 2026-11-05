using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Matrimony.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPaymentUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_PaymentId",
                table: "Subscriptions");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_PaymentId",
                table: "Subscriptions",
                column: "PaymentId",
                unique: true,
                filter: "[PaymentId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_PaymentId",
                table: "Subscriptions");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_PaymentId",
                table: "Subscriptions",
                column: "PaymentId");
        }
    }
}
