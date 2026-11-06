<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignUuid('issuing_office_id')->nullable()->constrained('offices')->onDelete('set null');
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignUuid('batch_id')->nullable()->constrained('invoice_batches')->onDelete('set null');
            $table->foreignUuid('schedule_id')->nullable()->constrained('invoice_schedules')->onDelete('set null');
            $table->string('status')->default('DRAFT');
            $table->string('number')->nullable();
            $table->string('series')->nullable();
            $table->string('dps_id')->nullable();
            $table->timestamp('issue_date')->nullable();
            $table->date('competence_date')->nullable();
            $table->decimal('service_amount', 15, 4)->nullable();
            $table->decimal('deductions_amount', 15, 4)->nullable();
            $table->decimal('net_amount', 15, 4)->nullable();
            $table->jsonb('borrower_snapshot')->nullable();
            $table->jsonb('iss_snapshot')->nullable();
            $table->jsonb('federal_taxes_snapshot')->nullable();
            $table->string('xml_url')->nullable();
            $table->string('pdf_url')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'status']);
        });

        // Add foreign key constraint for template_invoice_id on invoice_schedules table
        Schema::table('invoice_schedules', function (Blueprint $table) {
             $table->foreign('template_invoice_id')->references('id')->on('invoices')->onDelete('set null');
        });

        Schema::table('schedule_execution_logs', function (Blueprint $table) {
             $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_schedules', function (Blueprint $table) {
            $table->dropForeign(['template_invoice_id']);
        });

        Schema::table('schedule_execution_logs', function (Blueprint $table) {
            $table->dropForeign(['invoice_id']);
        });

        Schema::dropIfExists('invoices');
    }
};
