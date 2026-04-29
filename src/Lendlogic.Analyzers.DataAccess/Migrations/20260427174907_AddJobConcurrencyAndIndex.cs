using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lendlogic.Analyzers.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddJobConcurrencyAndIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                schema: "app",
                table: "jobs",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateIndex(
                name: "ix_jobs_job_status_created_at",
                schema: "app",
                table: "jobs",
                columns: new[] { "job_status", "created_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_jobs_job_status_created_at",
                schema: "app",
                table: "jobs");

            migrationBuilder.DropColumn(
                name: "xmin",
                schema: "app",
                table: "jobs");
        }
    }
}
