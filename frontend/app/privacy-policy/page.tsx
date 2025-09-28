"use client";
import React from "react";
import {
  FaShieldAlt,
  FaUserShield,
  FaDatabase,
  FaLock,
  FaSyncAlt,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { routes } from "@/app/routes/routes";

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background py-8 px-2">
      <section className="w-full max-w-2xl bg-card shadow-xl rounded-2xl border border-border p-6 sm:p-10 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => router.push(routes.dashboard)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition mb-4 focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1 bg-muted/50 hover:bg-muted"
          aria-label="Go back"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary text-primary-foreground rounded-full p-3 shadow-md">
            <FaShieldAlt size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              for Cardiac Delights Inventory Management System
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Effective Date: September 26, 2025
        </p>

        <hr className="my-4 border-muted" />

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-4 mb-2">
          <FaUserShield /> Introduction
        </h2>
        <p>
          At Cardiac Delights, we value the privacy and security of our system
          users. This Privacy Policy explains how we collect, use, and protect
          the personal information of authorized users (Owner, General Manager,
          Store Manager, and Assistant Store Manager) within our Inventory
          Management System.
        </p>
        <p className="mt-2">
          This system is intended solely for internal business use and is not
          accessible to the general public.
        </p>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaDatabase /> Information We Collect
        </h2>
        <p>
          We may collect and store the following types of information from
          system users:
        </p>
        <ul className="list-disc ml-8 mt-2 space-y-2">
          <li>
            <span className="font-semibold">Account Information</span>
            <ul className="list-disc ml-6">
              <li>Name, username, email, and role within the system.</li>
              <li>Login credentials (securely encrypted).</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">System Usage Data</span>
            <ul className="list-disc ml-6">
              <li>
                Actions taken in the system (e.g., adding, editing, or deleting
                inventory items).
              </li>
              <li>
                Access logs, timestamps, and role-based activity tracking.
              </li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Technical Information</span>
            <ul className="list-disc ml-6">
              <li>
                Device type, browser, and IP address used to access the system.
              </li>
            </ul>
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaLock /> How We Use Information
        </h2>
        <p>User data is used only for the following purposes:</p>
        <ul className="list-disc ml-8 mt-2 space-y-1">
          <li>To authenticate users and manage role-based access.</li>
          <li>To track system activity for accountability and transparency.</li>
          <li>To maintain accurate inventory records.</li>
          <li>To ensure system security and prevent unauthorized access.</li>
          <li>To comply with business and legal requirements.</li>
        </ul>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaSyncAlt /> Data Sharing
        </h2>
        <p>
          We do not sell or share user data outside of Cardiac Delights. Data
          may only be shared in these limited situations:
        </p>
        <ul className="list-disc ml-8 mt-2 space-y-1">
          <li>
            <span className="font-semibold">Internal Business Needs:</span> For
            monitoring, auditing, and system improvements.
          </li>
          <li>
            <span className="font-semibold">Legal Obligations:</span> When
            required by law, regulation, or legal process.
          </li>
          <li>
            <span className="font-semibold">Technical Support:</span> With
            authorized IT staff or service providers who help maintain the
            system.
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaLock /> Data Retention
        </h2>
        <p>
          We retain user account and activity data only as long as necessary for
          business operations and legal compliance. Inactive or terminated user
          accounts will be securely deleted or anonymized after a defined
          retention period.
        </p>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaLock /> Data Security
        </h2>
        <p>
          We implement role-based access controls, encrypted logins, and
          activity monitoring to protect user data. While we take reasonable
          measures to safeguard information, no system is 100% secure against
          all threats.
        </p>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaUserShield /> User Rights
        </h2>
        <p>As an authorized user of this system, you may:</p>
        <ul className="list-disc ml-8 mt-2 space-y-1">
          <li>
            Request access to the personal information associated with your
            account.
          </li>
          <li>Request correction of inaccurate account information.</li>
          <li>
            Request deletion of your account (subject to business and legal
            requirements).
          </li>
        </ul>
        <p className="mt-2">
          For assistance, please contact the system administrator.
        </p>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          <FaSyncAlt /> Updates to This Privacy Policy
        </h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in system use or compliance requirements. Updates will be effective
          upon posting within the system.
        </p>

        <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mt-6 mb-2">
          Contact Information
        </h2>
        <p>
          If you have questions or concerns about this Privacy Policy, please
          contact us at:
        </p>
        <div className="ml-8 mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-primary" />
            <span className="font-medium">
              cruz.309187@ortigas-cainta.sti.edu.ph
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaPhone className="text-primary" />
            <span className="font-medium">+639929173652</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-primary" />
            <span className="font-medium">
              Ortigas Ave Ext, Cainta, 1900 Rizal, Philippines
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-right">
          Last updated: September 26, 2025
        </p>
      </section>
    </main>
  );
}
