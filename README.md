<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="left">

# CAPSTONE-POS

<em>Transform Transactions, Elevate Customer Experiences Instantly</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/license/AcsOfficial/capstone-POS?style=flat&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
<img src="https://img.shields.io/github/last-commit/AcsOfficial/capstone-POS?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/AcsOfficial/capstone-POS?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/AcsOfficial/capstone-POS?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Autoprefixer-DD3735.svg?style=flat&logo=Autoprefixer&logoColor=white" alt="Autoprefixer">
<img src="https://img.shields.io/badge/PostCSS-DD3A0A.svg?style=flat&logo=PostCSS&logoColor=white" alt="PostCSS">
<br>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">

</div>
<br>

---

## 📄 Table of Contents

- [Overview](#-overview)
- [Getting Started](#-getting-started)
    - [Prerequisites](#-prerequisites)
    - [Installation](#-installation)
    - [Usage](#-usage)
    - [Testing](#-testing)
- [Features](#-features)
- [Project Structure](#-project-structure)
    - [Project Index](#-project-index)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgment](#-acknowledgment)

---

## ✨ Overview

capstone-POS is a full-stack point-of-sale system tailored for retail and hospitality environments, integrating a modern React frontend with a robust FastAPI backend. It offers a seamless transaction experience through real-time order management, customizable UI, and automated customer communication.

**Why capstone-POS?**

This project empowers developers to build reliable and scalable POS solutions with ease. The core features include:

- 🎯 **🧩 Modular Architecture:** Designed for scalability and maintainability, supporting growth and customization.
- 🌟 **⚙️ API & State Hooks:** React hooks like useApi and usePOSOrder streamline backend interactions and state management.
- 🎨 **🎨 Tailwind CSS Integration:** Consistent, customizable styling for a polished user interface.
- 🚀 **⚡ FastAPI Backend:** Efficient order processing, database management, and external integrations.
- 📧 **📩 Email Receipt Automation:** Built-in support for customer communication via EmailJS.
- 🔄 **🔧 Real-Time Data & Persistence:** Ensures smooth, reliable transaction workflows across sessions.

---

## 📌 Features

|      | Component            | Details                                                                                     |
| :--- | :------------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**     | <ul><li>Client-Server Model with separate frontend (React) and backend (Python)</li><li>RESTful API communication</li></ul> |
| 🔩 | **Code Quality**     | <ul><li>TypeScript used for frontend for type safety</li><li>Python code follows PEP8 standards</li><li>Linting via ESLint and Flake8</li></ul> |
| 📄 | **Documentation**    | <ul><li>README.md with project overview</li><li>API docs generated via Swagger/OpenAPI</li><li>Inline code comments and docstrings</li></ul> |
| 🔌 | **Integrations**     | <ul><li>Supabase JS SDK for database interactions</li><li>EmailJS for email notifications</li><li>TailwindCSS for styling</li></ul> |
| 🧩 | **Modularity**       | <ul><li>Frontend components organized in React with TSX modules</li><li>Backend structured with Flask-like routes and services</li><li>Separation of concerns between UI, API, and database layers</li></ul> |
| 🧪 | **Testing**          | <ul><li>Frontend tests via Jest and React Testing Library</li><li>Backend tests using pytest</li><li>CI pipelines include automated tests on push</li></ul> |
| ⚡️  | **Performance**      | <ul><li>Lazy loading of React components</li><li>Optimized API endpoints with caching strategies</li></ul> |
| 🛡️ | **Security**         | <ul><li>Input validation on both frontend and backend</li><li>Environment variables for sensitive info</li><li>Basic authentication and role-based access control</li></ul> |
| 📦 | **Dependencies**     | <ul><li>Frontend managed via npm with React, TailwindCSS, TypeScript</li><li>Backend dependencies via pip, including Flask, SQLAlchemy</li><li>Package versions specified in package.json and requirements.txt</li></ul> |

---

## 📁 Project Structure

```sh
└── capstone-POS/
    ├── Database
    │   └── add_pos_columns.sql
    ├── README.md
    ├── backend
    │   ├── .gitignore
    │   ├── __init__.py
    │   ├── app
    │   └── requirements.txt
    └── frontend
        ├── .gitignore
        ├── README.md
        ├── app
        ├── eslint.config.mjs
        ├── next.config.ts
        ├── package-lock.json
        ├── package.json
        ├── postcss.config.mjs
        ├── public
        ├── tailwind.config.js
        └── tsconfig.json
```

---

### 📑 Project Index

<details open>
	<summary><b><code>CAPSTONE-POS/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides an overview of the capstone-POS project, outlining its core purpose and functionality within the overall architecture<br>- It highlights how the system facilitates point-of-sale operations, integrating key components to deliver a seamless transaction experience<br>- This summary emphasizes the projects role in supporting retail or service environments through efficient and reliable sales processing.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- frontend Submodule -->
	<details>
		<summary><b>frontend</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ frontend</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/tailwind.config.js'>tailwind.config.js</a></b></td>
					<td style='padding: 8px;'>- Defines the styling framework for the frontend, specifying which files are scanned for class usage and extending the default theme with custom color palettes<br>- This configuration ensures consistent visual design across pages and components, facilitating a cohesive user interface aligned with the projects branding and aesthetic standards.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/eslint.config.mjs'>eslint.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Defines ESLint configuration tailored for the frontend, ensuring code quality and consistency across the Next.js project<br>- It extends standard Next.js and TypeScript linting rules while customizing specific rules to accommodate project preferences<br>- This setup supports maintaining a clean, reliable codebase aligned with best practices in the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the frontend applications configuration, dependencies, and scripts essential for development, building, and deployment<br>- It orchestrates the setup of a Next.js-based user interface that integrates with backend services, manages styling with Tailwind CSS, and supports email and database interactions via EmailJS and Supabase<br>- This setup enables a seamless, scalable, and maintainable user experience within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/postcss.config.mjs'>postcss.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Configure PostCSS to integrate Tailwind CSS styles within the frontend build process, enabling efficient styling and utility class management<br>- This setup ensures consistent, scalable design implementation across the application, supporting the overall architecture by streamlining CSS processing and maintaining a cohesive visual framework throughout the project.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/next.config.ts'>next.config.ts</a></b></td>
					<td style='padding: 8px;'>- Defines the configuration for the Next.js frontend application, establishing default settings and enabling customization of build and runtime behaviors<br>- Serves as the central point for managing Next.js-specific options, ensuring the frontend operates according to project standards and integrates seamlessly within the overall architecture<br>- Facilitates consistent environment setup and future scalability.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/tsconfig.json'>tsconfig.json</a></b></td>
					<td style='padding: 8px;'>- Defines TypeScript compiler options to ensure consistent, strict, and optimized development of the frontend application<br>- It facilitates seamless integration with Next.js, supports modern JavaScript features, and maintains type safety across the codebase, contributing to a robust and maintainable architecture for the web project.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides an overview of the Next.js-based frontend application, highlighting its role in delivering a dynamic, optimized user interface<br>- It guides developers on setup, development, and deployment processes, emphasizing the use of modern font optimization and seamless auto-updating features<br>- This README supports onboarding and ensures smooth integration within the overall project architecture.</td>
				</tr>
			</table>
			<!-- app Submodule -->
			<details>
				<summary><b>app</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ frontend.app</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/layout.tsx'>layout.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the root layout for the Cardiac Delights POS application, establishing global styles, fonts, metadata, and essential external scripts<br>- It sets the foundational structure for consistent UI rendering across pages, manages branding elements like icons, and initializes third-party services such as EmailJS to facilitate email functionalities within the entire frontend architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/page.tsx'>page.tsx</a></b></td>
							<td style='padding: 8px;'>- Frontend/app/page.tsx`This file serves as the main entry point for the Point of Sale (POS) interface within the application<br>- It manages the client-side state related to order tracking, including loading existing order mappings from local storage and handling daily reset logic<br>- By orchestrating the user interface and ensuring data persistence across sessions, this component facilitates seamless order management and daily operational resets, forming a critical part of the overall frontend architecture for the POS system.</td>
						</tr>
					</table>
					<!-- hook Submodule -->
					<details>
						<summary><b>hook</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.hook</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/useApi.ts'>useApi.ts</a></b></td>
									<td style='padding: 8px;'>- Provides React hooks for seamless interaction with the backend API, enabling efficient data fetching, creation, updating, and deletion of order-related resources<br>- Facilitates state management for API responses, error handling, and request execution, supporting various order operations and summaries within the applications architecture<br>- Enhances frontend integration with backend services through reusable, declarative hooks.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/index.ts'>index.ts</a></b></td>
									<td style='padding: 8px;'>- Provides centralized access to core POS functionalities, including order management, modal handling, email receipt processing, and utility hooks<br>- Facilitates seamless integration of essential features within the POS system, enabling consistent state management and user interactions across the application<br>- Serves as a foundational hook that orchestrates key components for a cohesive point-of-sale experience.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/usePOSOrder.ts'>usePOSOrder.ts</a></b></td>
									<td style='padding: 8px;'>- UsePOSOrder HookThis hook encapsulates the core logic for managing Point of Sale (POS) orders within the frontend application<br>- It provides a streamlined interface for creating, updating, retrieving, and deleting orders, facilitating seamless order handling in a retail or hospitality environment<br>- By maintaining current order state, handling held orders, and managing notifications, it ensures a responsive and user-friendly POS experience, integrating with backend APIs to synchronize order data across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/usePOSUtils.ts'>usePOSUtils.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a collection of React hooks to enhance user experience and application functionality within the frontend architecture<br>- These hooks facilitate real-time clock updates, customer input management, keyboard shortcut handling, local storage persistence, input debouncing, toggle states, and tracking previous values, supporting dynamic, responsive, and stateful interactions across the POS interface.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/usePOSModals.ts'>usePOSModals.ts</a></b></td>
									<td style='padding: 8px;'>- Provides centralized management of POS modal states and interactions within the frontend application<br>- Facilitates opening, closing, and data handling for various modals such as payments, confirmations, and receipts, ensuring seamless user workflows during transactions<br>- Enhances modularity and maintainability by encapsulating modal logic, supporting a cohesive and responsive POS user experience.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/hook/useEmailReceipt.ts'>useEmailReceipt.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates sending digital email receipts for orders by integrating with EmailJS, managing receipt data, generating formatted HTML content, and enabling printing<br>- Supports seamless customer communication and record-keeping within the overall order management architecture, ensuring reliable delivery and presentation of transaction summaries.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- Utils Submodule -->
					<details>
						<summary><b>Utils</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.Utils</b></code>
							<!-- Server Submodule -->
							<details>
								<summary><b>Server</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Utils.Server</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/frontend/app/Utils/Server/supabaseClient.js'>supabaseClient.js</a></b></td>
											<td style='padding: 8px;'>- Establishes a centralized Supabase client for seamless backend interactions within the frontend application<br>- Facilitates secure and efficient communication with the database and authentication services, supporting core functionalities such as user management, data retrieval, and real-time updates<br>- Integrates environment variables to ensure configuration flexibility across different deployment environments, contributing to the overall modularity and scalability of the codebase.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- backend Submodule -->
	<details>
		<summary><b>backend</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ backend</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/requirements.txt'>requirements.txt</a></b></td>
					<td style='padding: 8px;'>- Defines project dependencies and environment requirements, ensuring consistent setup across development and deployment<br>- It manages essential libraries for web server operation, API interactions, data processing, and security, forming the foundation for backend functionality<br>- This requirements file supports the overall architecture by facilitating reliable, reproducible environments critical for scalable and maintainable backend services.</td>
				</tr>
			</table>
			<!-- app Submodule -->
			<details>
				<summary><b>app</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ backend.app</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/app/main.py'>main.py</a></b></td>
							<td style='padding: 8px;'>- Defines the core FastAPI application, orchestrating request handling, error management, and CORS configuration<br>- Integrates route modules for order and order item management, establishing the primary interface for backend API interactions<br>- Also includes a health check endpoint to monitor service status, supporting overall system reliability and communication within the microservices architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/app/supabase.py'>supabase.py</a></b></td>
							<td style='padding: 8px;'>- Establishes core backend integrations by configuring the Supabase client for external service interactions and setting up asynchronous access to the PostgreSQL database via SQLAlchemy<br>- Facilitates seamless data operations and external API communications, serving as a foundational component that supports data management, authentication, and external integrations within the overall architecture.</td>
						</tr>
					</table>
					<!-- routes Submodule -->
					<details>
						<summary><b>routes</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ backend.app.routes</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/app/routes/order_item_routes.py'>order_item_routes.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing order items, including creation, retrieval, updating, and deletion within the e-commerce system<br>- Facilitates aggregation of popular items and revenue summaries, enabling insights into sales performance and order details<br>- Integrates with the database to support comprehensive order item operations aligned with overall order management architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/app/routes/order_routes_async.py'>order_routes_async.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates comprehensive management of restaurant orders by enabling creation, status updates, retrieval, cancellation, and summarization<br>- Integrates asynchronous database operations to ensure efficient handling of order data, supporting various order states and types<br>- Serves as a core component for maintaining accurate order lifecycle tracking within the overall system architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- models Submodule -->
					<details>
						<summary><b>models</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ backend.app.models</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/backend/app/models/order.py'>order.py</a></b></td>
									<td style='padding: 8px;'>- Defines the data models for capturing and managing customer orders and associated items within the applications database<br>- Facilitates structured storage of order details, including financials, status, and item specifics, enabling seamless order processing, tracking, and retrieval in the overall system architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- Database Submodule -->
	<details>
		<summary><b>Database</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ Database</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/capstone-POS/blob/master/Database/add_pos_columns.sql'>add_pos_columns.sql</a></b></td>
					<td style='padding: 8px;'>- Enhances the POS system by adding essential order-related columns to support customer details, payment tracking, and order types, ensuring comprehensive data capture<br>- Optimizes database performance through indexing and updates existing orders to reflect accurate payment statuses<br>- This migration facilitates improved order management, reporting, and customer service within the overall application architecture.</td>
				</tr>
			</table>
		</blockquote>
	</details>
</details>

---

## 🚀 Getting Started

### 📋 Prerequisites

This project requires the following dependencies:

- **Programming Language:** TypeScript
- **Package Manager:** Npm, Pip

### ⚙️ Installation

Build capstone-POS from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/AcsOfficial/capstone-POS
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd capstone-POS
    ```

3. **Install the dependencies:**

**Using [npm](https://www.npmjs.com/):**

```sh
❯ npm install
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
❯ pip install -r backend/requirements.txt
```

### 💻 Usage

Run the project with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm start
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
python {entrypoint}
```

### 🧪 Testing

Capstone-pos uses the {__test_framework__} test framework. Run the test suite with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm test
```
**Using [pip](https://pypi.org/project/pip/):**

```sh
pytest
```

---

## 📈 Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## 🤝 Contributing

- **💬 [Join the Discussions](https://github.com/AcsOfficial/capstone-POS/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/AcsOfficial/capstone-POS/issues)**: Submit bugs found or log feature requests for the `capstone-POS` project.
- **💡 [Submit Pull Requests](https://github.com/AcsOfficial/capstone-POS/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/AcsOfficial/capstone-POS
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com{/AcsOfficial/capstone-POS/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=AcsOfficial/capstone-POS">
   </a>
</p>
</details>

---

## 📜 License

Capstone-pos is protected under the [LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## ✨ Acknowledgments

- Credit `contributors`, `inspiration`, `references`, etc.

<div align="left"><a href="#top">⬆ Return</a></div>

---
