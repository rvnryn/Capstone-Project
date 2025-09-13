<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="left">

# CAPSTONE-PROJECT

<em>Transforming Ideas Into Impactful Solutions Daily</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/license/AcsOfficial/Capstone-Project?style=flat&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
<img src="https://img.shields.io/github/last-commit/AcsOfficial/Capstone-Project?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/AcsOfficial/Capstone-Project?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/AcsOfficial/Capstone-Project?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/SWR-000000.svg?style=flat&logo=SWR&logoColor=white" alt="SWR">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/PostCSS-DD3A0A.svg?style=flat&logo=PostCSS&logoColor=white" alt="PostCSS">
<img src="https://img.shields.io/badge/.ENV-ECD53F.svg?style=flat&logo=dotenv&logoColor=black" alt=".ENV">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<br>
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat&logo=TypeScript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">
<img src="https://img.shields.io/badge/Chart.js-FF6384.svg?style=flat&logo=chartdotjs&logoColor=white" alt="Chart.js">

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

Capstone-Project is a comprehensive developer toolkit designed to accelerate full-stack application development. It combines a modular architecture with powerful frontend and backend integrations, enabling the creation of scalable, secure, and responsive web solutions. The core features include:

- 🛠️ **Modular Architecture:** Seamlessly connect frontend and backend components for efficient development.
- 🔐 **Secure Authentication:** Implement role-based access control with integrated user management.
- 📊 **Real-Time Analytics:** Leverage live inventory, sales, and user activity data for informed decision-making.
- ☁️ **Cloud Backup & Restore:** Automate data backups with cloud storage integration for data resilience.
- 🚀 **Progressive Web App (PWA):** Build fast, offline-capable interfaces with responsive design.
- ⚙️ **Developer Utilities:** Simplify styling, loading states, and API interactions for a smoother workflow.

---

## 📌 Features

|      | Component           | Details                                                                                     |
| :--- | :------------------ | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**     | <ul><li>Modular monorepo structure with separate frontend and backend directories</li><li>Client-side built with Next.js (React framework)</li><li>Backend likely Python-based (requirements.txt) with API endpoints</li><li>Clear separation of concerns between UI, API, and data layers</li></ul> |
| 🔩 | **Code Quality**     | <ul><li>TypeScript used extensively for frontend type safety</li><li>ESLint and Next.js recommended configs for linting</li><li>Python code adheres to PEP8 standards, with dependencies managed via requirements.txt</li></ul> |
| 📄 | **Documentation**    | <ul><li>README.md provides project overview and setup instructions</li><li>Code comments and type annotations present in TypeScript and Python</li><li>API documentation likely generated via Swagger or similar tools (not explicitly shown)</li></ul> |
| 🔌 | **Integrations**     | <ul><li>Supabase JS SDK for backend data storage and auth</li><li>OAuth via @react-oauth/google</li><li>Chart.js for data visualization</li><li>Axios for HTTP requests with retry logic</li><li>Tailwind CSS for styling</li></ul> |
| 🧩 | **Modularity**       | <ul><li>Frontend components built with React, organized into reusable components</li><li>Backend functions modularized with separate API routes</li><li>Shared types/interfaces across frontend and backend</li></ul> |
| 🧪 | **Testing**          | <ul><li>Testing frameworks not explicitly listed, but likely Jest for frontend (implied by React/TypeScript)</li><li>Python tests via pytest or unittest (not explicitly shown)</li><li>CI/CD pipelines probably include test scripts with npm and pip</li></ul> |
| ⚡️  | **Performance**      | <ul><li>Use of React Query (@tanstack/react-query) and SWR for efficient data fetching and caching</li><li>Code splitting and lazy loading via Next.js</li><li>Chart.js optimized for rendering large datasets</li></ul> |
| 🛡️ | **Security**         | <ul><li>OAuth integration for user authentication</li><li>Credentials stored in credentials.json, likely secured via environment variables in CI/CD</li><li>Use of HTTPS in deployment (assumed)</li></ul> |
| 📦 | **Dependencies**     | <ul><li>Frontend managed via package.json with React, Tailwind, Axios, Chart.js, etc.</li><li>Backend dependencies via requirements.txt, including Python packages</li><li>Build tools include npm, pip, and related scripts</li></ul> |

---

## 📁 Project Structure

```sh
└── Capstone-Project/
    ├── Database
    │   ├── schema.sql
    │   └── superbase.env
    ├── README.md
    ├── backend
    │   ├── .env
    │   ├── __init__.py
    │   ├── app
    │   └── requirements.txt
    ├── frontend
    │   ├── .gitignore
    │   ├── PWA_USAGE_GUIDE.md
    │   ├── README.md
    │   ├── RESPONSIVE_ARCHITECTURE.md
    │   ├── app
    │   ├── eslint.config.mjs
    │   ├── next.config.ts
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.mjs
    │   ├── public
    │   ├── tailwind.config.js
    │   └── tsconfig.json
    ├── package-lock.json
    └── package.json
```

---

### 📑 Project Index

<details open>
	<summary><b><code>CAPSTONE-PROJECT/</code></b></summary>
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
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines project dependencies and development tools, ensuring proper integration of cryptographic functions, animation capabilities, and type support<br>- Facilitates smooth development workflows and maintains consistency across the codebase by managing essential libraries such as crypto-js, framer-motion, and type definitions for pako<br>- Supports the overall architecture by streamlining setup and dependency management for a robust, feature-rich application.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- The main purpose of this code file, <code>README.md</code>, is to serve as the comprehensive documentation and project overview for the <strong>CAPSTONE-PROJECT</strong><br>- It introduces the projects core mission—transforming ideas into impactful solutions—and highlights the key tools and technologies used in its development<br>- This README provides essential context, project structure, and badges that communicate the projects status, licensing, and technical stack, thereby guiding contributors and users to understand the overall architecture and intent of the codebase.</td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/PWA_USAGE_GUIDE.md'>PWA_USAGE_GUIDE.md</a></b></td>
					<td style='padding: 8px;'>- Provides a comprehensive guide for integrating Progressive Web App (PWA) features into various pages, enabling offline support, smart caching, and real-time sync indicators<br>- It simplifies data management by offering reusable hooks and components that enhance user experience through offline accessibility, visual status updates, and automatic data synchronization, ensuring a seamless and resilient application architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tailwind.config.js'>tailwind.config.js</a></b></td>
					<td style='padding: 8px;'>- Defines custom Tailwind CSS configuration to enhance responsive design across diverse devices and orientations<br>- Extends default breakpoints, spacing, font sizes, and border widths, enabling precise styling for ultra-wide, small, and height-constrained screens<br>- Facilitates consistent, adaptable UI layouts tailored to a broad spectrum of user devices and viewing contexts within the project.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/eslint.config.mjs'>eslint.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Defines ESLint configuration tailored for the frontend, ensuring code quality and consistency across the Next.js project<br>- It extends standard Next.js and TypeScript linting rules while customizing specific rules and ignoring certain directories to streamline development and maintain best practices within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/RESPONSIVE_ARCHITECTURE.md'>RESPONSIVE_ARCHITECTURE.md</a></b></td>
					<td style='padding: 8px;'>- Defines the applications responsive layout architecture, enabling seamless adaptation across mobile, tablet, and desktop devices<br>- Manages device detection, layout adjustments, and component behaviors to ensure optimal user experience, interface consistency, and performance<br>- Facilitates responsive navigation, modals, and content presentation, supporting a cohesive multi-device interface aligned with the overall design system.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the frontend applications configuration, dependencies, and scripts to facilitate development, building, and deployment within the overall system architecture<br>- It ensures seamless integration of UI components, third-party libraries, and development tools, supporting a responsive and interactive user experience aligned with backend services and data management layers.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/postcss.config.mjs'>postcss.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Configure PostCSS to integrate Tailwind CSS styles within the frontend architecture, enabling streamlined styling workflows<br>- This setup ensures consistent application of utility-first CSS across the project, supporting scalable and maintainable UI development within the overall frontend framework.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/next.config.ts'>next.config.ts</a></b></td>
					<td style='padding: 8px;'>- Configure Next.js to route API requests to the backend server and enable secure image loading from specified remote domains, supporting seamless integration between frontend and backend services within the overall architecture<br>- This setup ensures efficient API communication and optimized image handling, contributing to a cohesive and scalable web application environment.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tsconfig.json'>tsconfig.json</a></b></td>
					<td style='padding: 8px;'>- Defines TypeScript compiler options for the frontend project, ensuring consistent, type-safe development aligned with modern JavaScript standards<br>- Facilitates smooth integration with Next.js and other dependencies, supporting efficient build processes and maintainability within the overall architecture<br>- This configuration underpins the development environment, enabling reliable and scalable frontend code execution.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides the foundational structure for a Next.js web application, enabling rapid development and deployment of a dynamic, optimized frontend interface<br>- Facilitates seamless editing, font optimization, and local testing, serving as the entry point for user interactions and visual presentation within the overall project architecture.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/AppShell.tsx'>AppShell.tsx</a></b></td>
							<td style='padding: 8px;'>- Establishes the core application shell by integrating global providers for state management, data fetching, and authentication<br>- Manages Progressive Web App (PWA) behaviors, including custom install prompts and banner suppression, while ensuring service worker registration for offline capabilities<br>- Facilitates consistent user experience and app stability across the entire frontend architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/layout.tsx'>layout.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the root layout for the Cardiac Delights PWA, establishing global metadata, fonts, and styling<br>- Integrates the AppShell component to structure the applications overall interface, ensuring responsiveness, offline capabilities, and consistent theming across the dashboard and management platform<br>- Serves as the foundational entry point for rendering the applications core layout and metadata.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/page.tsx'>page.tsx</a></b></td>
							<td style='padding: 8px;'>- Facilitates user authentication by providing a login interface integrated with backend API and Supabase services<br>- Manages user input, handles login flow, displays feedback modals, and supports password reset functionality<br>- Serves as the primary entry point for user access, ensuring secure session initiation and seamless navigation to the dashboard within the overall application architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/loading.tsx'>loading.tsx</a></b></td>
							<td style='padding: 8px;'>- Provides a full-screen loading indicator to enhance user experience during asynchronous operations or page transitions<br>- It visually communicates ongoing processes, maintaining engagement and preventing user confusion while the application loads or fetches data within the overall frontend architecture.</td>
						</tr>
					</table>
					<!-- components Submodule -->
					<details>
						<summary><b>components</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.components</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/GlobalLoader.tsx'>GlobalLoader.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a global loading overlay that visually indicates ongoing background processes across the application<br>- Integrates with the app’s loading context to display a centered, animated spinner during loading states, ensuring users receive clear feedback during asynchronous operations<br>- Enhances user experience by maintaining visual consistency and responsiveness throughout the frontend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/loadingscreen.tsx'>loadingscreen.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a full-screen loading indicator with branding visuals to enhance user experience during data fetching or page transitions within the frontend application<br>- It ensures users are visually engaged and informed that content is loading, maintaining a polished and cohesive interface aligned with the overall architecture of the Next.js-based project.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/ResponsiveMain.tsx'>ResponsiveMain.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a responsive layout wrapper that dynamically adjusts main content margins based on device type, screen size, and menu state<br>- Ensures optimal content presentation across various devices by managing layout shifts and preventing overflow, while delaying rendering until client-side hydration to avoid mismatch issues<br>- Integrates seamlessly within the overall architecture to enhance user experience and layout consistency.</td>
								</tr>
							</table>
							<!-- UI Submodule -->
							<details>
								<summary><b>UI</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.components.UI</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/UI/cards.tsx'>cards.tsx</a></b></td>
											<td style='padding: 8px;'>- Defines a set of reusable, styled React components for building consistent card interfaces within the application<br>- These components facilitate the creation of structured, visually cohesive card layouts, enhancing UI modularity and maintainability across the frontend architecture<br>- They serve as foundational building blocks for presenting grouped content in a clear and organized manner.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- navigation Submodule -->
							<details>
								<summary><b>navigation</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.components.navigation</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/navigation/navigation.tsx'>navigation.tsx</a></b></td>
											<td style='padding: 8px;'>- Navigation Component (<code>navigation.tsx</code>)This file defines the primary navigation component for the applications frontend<br>- It orchestrates user interface elements such as menus, icons, and routing logic to facilitate seamless user navigation across different sections of the app<br>- By integrating authentication context, routing utilities, and offline capabilities, it ensures a responsive and user-friendly navigation experience<br>- Overall, this component serves as the central hub for user interaction, enabling efficient access to various features and maintaining consistent navigation behavior within the application's architecture.</td>
										</tr>
									</table>
									<!-- hook Submodule -->
									<details>
										<summary><b>hook</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.components.navigation.hook</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/navigation/hook/use-navigation.ts'>use-navigation.ts</a></b></td>
													<td style='padding: 8px;'>- Provides comprehensive management of navigation and responsive behavior across devices within the application<br>- It detects device type, screen size, orientation, and accessibility preferences, while handling menu state, online status, and PWA mode<br>- Facilitates adaptive UI adjustments and user experience consistency by centralizing navigation-related state and interactions across the entire codebase.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- PWA Submodule -->
							<details>
								<summary><b>PWA</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.components.PWA</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAComponents.tsx'>PWAComponents.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides user interface components to enhance Progressive Web App (PWA) functionality by enabling installation prompts, monitoring network connectivity, and displaying app status<br>- Facilitates offline access, user engagement, and transparency regarding app capabilities, integrating seamlessly into the overall architecture to improve user experience and system awareness within the frontend ecosystem.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExampleUsage.tsx'>PWAExampleUsage.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements a comprehensive example of integrating Progressive Web App (PWA) features into an inventory management page<br>- It demonstrates smart caching, offline data handling, sync status updates, and optimistic updates, enabling seamless offline functionality and real-time synchronization<br>- This component serves as a practical template for enhancing user experience through resilient, offline-capable web applications within the overall architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAStatus.tsx'>PWAStatus.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides user interface components to monitor and display the status of Progressive Web App (PWA) connectivity, offline data caching, and synchronization processes<br>- Facilitates real-time feedback on online/offline states, pending actions, and cached data freshness, ensuring users are informed about data sync status and offline capabilities within the overall application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExample.tsx'>PWAExample.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a comprehensive example of integrating Progressive Web App (PWA) features into a feature page, demonstrating offline support, network status handling, notification permissions, and offline data synchronization<br>- It showcases how to enhance user experience and reliability in a web application by leveraging PWA capabilities within the overall architecture.</td>
										</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- Features Submodule -->
					<details>
						<summary><b>Features</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.Features</b></code>
							<!-- Report Submodule -->
							<details>
								<summary><b>Report</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Report</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>page.tsx</code> file within the <code>frontend/app/Features/Report</code> directory serves as the main interface for accessing various analytical reports in the application<br>- It provides users with a centralized dashboard that facilitates navigation to detailed sales, inventory, and user activity reports<br>- By integrating role-based access and intuitive UI components, this page enhances the user experience in retrieving and visualizing key business metrics, thereby supporting data-driven decision-making across the platform.</td>
										</tr>
									</table>
									<!-- Report_Inventory Submodule -->
									<details>
										<summary><b>Report_Inventory</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Report.Report_Inventory</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Inventory/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Report Inventory PageThis file defines the main interface for the Inventory Report feature within the application<br>- It serves as the central component responsible for displaying, filtering, and exporting inventory data, providing users with insights into stock levels, wastage, and other key metrics<br>- The page integrates various UI elements such as search, filters, and charts to facilitate comprehensive analysis of inventory status<br>- It also supports data export functionalities like CSV or Excel downloads, enabling users to efficiently manage and share inventory reports<br>- Overall, this component plays a crucial role in delivering a user-friendly, data-driven overview of inventory health within the broader application architecture.</td>
												</tr>
											</table>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Report.Report_Inventory.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Inventory/hook/use-inventoryreport.ts'>use-inventoryreport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides an API hook for managing inventory logs within the application, enabling retrieval and storage of inventory actions such as stock changes and wastage<br>- Integrates seamlessly with backend endpoints to facilitate data synchronization, supporting features like date-range filtering and log updates, thereby ensuring accurate and up-to-date inventory reporting across the system.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- Report_Sales Submodule -->
									<details>
										<summary><b>Report_Sales</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Report.Report_Sales</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Report_Sales PageThis file defines the main interface for the Sales Report feature within the application<br>- It orchestrates user interactions, data fetching, and visualization of sales data, providing users with insights into sales performance through charts, filters, and downloadable reports<br>- The page integrates with Google Sheets for data import, enabling seamless data updates, and leverages various UI components to deliver an interactive and responsive reporting experience<br>- Overall, it serves as the central hub for viewing, analyzing, and exporting sales metrics, aligning with the applications broader architecture of modular, data-driven reporting.</td>
												</tr>
											</table>
											<!-- hooks Submodule -->
											<details>
												<summary><b>hooks</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Report.Report_Sales.hooks</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/index.ts'>index.ts</a></b></td>
															<td style='padding: 8px;'>- Provides centralized access to sales reporting functionalities within the frontend architecture, enabling comprehensive and simplified retrieval of sales data, performance metrics, and comparisons<br>- Facilitates consistent integration of sales insights across the application, supporting data-driven decision-making and user-facing reporting features in the overall project.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSimpleSalesReport.ts'>useSimpleSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a hook to fetch and manage simplified sales report data across various timeframes, integrating summary metrics, top-selling items, and daily sales trends<br>- Facilitates seamless data retrieval and state management for sales analytics within the frontend, supporting dynamic reporting and visualization in the overall application architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSalesReport.ts'>useSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a comprehensive hook for managing sales report data within the frontend architecture<br>- Facilitates fetching, state management, and formatting of various sales metrics, enabling seamless integration of sales analytics features<br>- Supports dynamic data retrieval for summaries, item performance, time-based trends, hourly insights, and comparative analysis, thereby empowering data-driven decision-making across the application.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- Report_UserActivity Submodule -->
									<details>
										<summary><b>Report_UserActivity</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Report.Report_UserActivity</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_UserActivity/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Report_UserActivity PageThis file implements the user activity reporting interface within the application<br>- Its primary purpose is to enable users to view, filter, and analyze user activity data through an interactive dashboard<br>- The page facilitates data retrieval from backend APIs, supports exporting reports to Excel, and integrates Google OAuth for seamless data import from Google Sheets<br>- Overall, it serves as the central component for visualizing and managing user activity insights, contributing to the broader analytics and reporting architecture of the project.</td>
												</tr>
											</table>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Report.Report_UserActivity.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_UserActivity/hook/use-userActivityLogAPI.ts'>use-userActivityLogAPI.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a hook for managing user activity logs within the application, enabling fetching and creating activity records through API interactions<br>- Facilitates tracking user actions, roles, and timestamps, supporting auditability and user behavior analysis across the platform<br>- Integrates seamlessly into the frontend architecture to ensure real-time updates and error handling for user activity data.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- Menu Submodule -->
							<details>
								<summary><b>Menu</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Menu</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- Menu Page ComponentThis file defines the main user interface for managing menu items within the application<br>- It serves as the central hub for displaying, sorting, and performing actions on menu entries, integrating authentication context and responsive design to ensure a seamless user experience<br>- The component interacts with backend APIs to fetch, update, and delete menu data, enabling authorized users to efficiently manage the menu offerings<br>- Overall, it plays a crucial role in the applications architecture by providing a dynamic, interactive interface for menu administration, supporting the broader goal of streamlined content management within the system.</td>
										</tr>
									</table>
									<!-- hook Submodule -->
									<details>
										<summary><b>hook</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Menu.hook</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/hook/use-menu.ts'>use-menu.ts</a></b></td>
													<td style='padding: 8px;'>- Provides an abstraction layer for interacting with the menu management API, enabling seamless retrieval, creation, updating, and deletion of menu items and ingredients<br>- Facilitates synchronization of menu data, including images and stock status, supporting dynamic menu operations within the applications architecture<br>- Enhances maintainability and scalability of menu-related functionalities across the frontend.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- Update_Menu Submodule -->
									<details>
										<summary><b>Update_Menu</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Menu.Update_Menu</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/Update_Menu/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Menu/Update_Menu</code> directory serves as the main interface for editing menu items within the application<br>- It provides users with the ability to view, modify, and manage menu details, including images and ingredients<br>- This component integrates with the applications API layer to fetch existing menu data, handle updates, and facilitate deletions, ensuring a seamless user experience for menu management<br>- Overall, it plays a crucial role in the menu feature by enabling dynamic, real-time editing capabilities within the broader frontend architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/Update_Menu/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during menu update operations within the frontend application<br>- It ensures users receive immediate feedback while the system processes changes, enhancing user experience and interface responsiveness<br>- As part of the loading states in the menu feature, it supports seamless interaction flow during asynchronous data fetching or updates in the overall architecture.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- View_Menu Submodule -->
									<details>
										<summary><b>View_Menu</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Menu.View_Menu</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/View_Menu/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- ViewMenu ComponentThis component serves as the primary interface for viewing detailed information about a specific menu within the application<br>- It integrates user authentication, routing, and API data fetching to present a comprehensive view of menu data, tailored to the users role<br>- The component ensures a responsive and user-friendly experience, enabling users to access menu details seamlessly and navigate back or perform related actions as needed<br>- Overall, it acts as the central presentation layer for menu visualization within the larger frontend architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/View_Menu/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a placeholder component for the menu loading state within the frontend application<br>- It integrates into the overall architecture by managing user experience during data fetches or asynchronous operations, ensuring a seamless transition while menu content loads<br>- This minimalistic approach maintains interface consistency without rendering any visual elements during the loading phase.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- Add_Menu Submodule -->
									<details>
										<summary><b>Add_Menu</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Menu.Add_Menu</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/Add_Menu/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Add_Menu PageThis component provides the user interface for adding a new menu item within the application<br>- It enables users to input dish details, upload images, and submit new menu entries, integrating seamlessly into the overall menu management architecture<br>- The page manages form state, handles image previews, and coordinates with backend APIs to create new menu items, supporting a smooth and intuitive user experience for menu administration.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- Settings Submodule -->
							<details>
								<summary><b>Settings</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Settings</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>page.tsx</code> file within the Settings feature serves as the central user interface for managing application configurations<br>- It provides a navigable settings dashboard that allows users to access and modify key system areas such as user management, notifications, inventory, and backup/restore options<br>- By integrating role-based access and intuitive navigation, this component facilitates seamless configuration management, contributing to the overall modular and user-centric architecture of the application.</td>
										</tr>
									</table>
									<!-- notification Submodule -->
									<details>
										<summary><b>notification</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Settings.notification</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/notification/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- NotificationSettings PageThis file implements the user interface for managing notification preferences within the applications settings section<br>- It provides users with the ability to view, modify, and save their notification configurations, ensuring a personalized and responsive experience<br>- The component integrates with backend services to fetch and persist user-specific notification settings, facilitating seamless synchronization between the frontend and backend systems<br>- Overall, it plays a crucial role in enabling users to control their notification preferences, contributing to the application's customizable and user-centric architecture.</td>
												</tr>
											</table>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.notification.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/notification/hook/use-NotificationSettingsAPI.ts'>use-NotificationSettingsAPI.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a React hook for managing user notification preferences, enabling fetching, updating, and reloading notification settings from the backend API<br>- Facilitates seamless synchronization of notification configurations, ensuring users can customize alerts related to stock levels and expiration dates within the applications settings architecture<br>- Enhances user experience by maintaining consistent notification state across the frontend.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- inventory Submodule -->
									<details>
										<summary><b>inventory</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Settings.inventory</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/inventory/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Inventory Settings PageThis code defines the Inventory Settings page within the applications frontend, serving as a central interface for managing inventory categories and their configurations<br>- It enables users to view, create, update, and delete inventory settings, facilitating dynamic and flexible inventory management<br>- The page integrates with backend APIs to synchronize changes and provides a user-friendly interface with navigation and responsive design elements<br>- Overall, it plays a crucial role in maintaining accurate and organized inventory data, supporting the broader architecture's goal of efficient resource management and operational consistency.</td>
												</tr>
											</table>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.inventory.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/inventory/hook/use-InventorySettingsAPI.ts'>use-InventorySettingsAPI.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a custom React hook for managing inventory settings via API interactions, enabling fetching, creating, updating, and deleting inventory configuration data<br>- Integrates seamlessly within the frontend architecture to facilitate dynamic inventory management, ensuring consistent state handling and error management across the applications inventory settings feature.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- userManagement Submodule -->
									<details>
										<summary><b>userManagement</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Settings.userManagement</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement</code> directory serves as the main interface for managing user accounts within the application<br>- It provides a comprehensive view of user data, including identifiers, names, roles, and statuses, and facilitates key user management actions such as editing, deleting, and password changes<br>- This component integrates navigation and responsive design elements to ensure a seamless user experience across devices<br>- Overall, it acts as the central hub for administrators to oversee and maintain user information, supporting the broader architectures focus on secure and efficient user management.</td>
												</tr>
											</table>
											<!-- Add_Users Submodule -->
											<details>
												<summary><b>Add_Users</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.userManagement.Add_Users</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/Add_Users/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- AddUsers PageThis component provides the user interface for adding new users within the applications settings section<br>- It facilitates user creation by capturing relevant details, managing user roles, and handling form interactions<br>- The page integrates with backend services to persist new user data and ensures a smooth user experience through modals and navigation safeguards<br>- Overall, it plays a crucial role in the user management workflow, enabling administrators to efficiently onboard new users while maintaining data integrity and usability within the broader application architecture.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- Update_Users Submodule -->
											<details>
												<summary><b>Update_Users</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.userManagement.Update_Users</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/Update_Users/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- SummaryThe <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement/Update_Users</code> directory serves as the main interface for editing user details within the applications user management system<br>- It provides a user-friendly form that allows administrators to view and modify user information, such as roles and status, and to update user credentials like passwords<br>- This component integrates with backend APIs to fetch existing user data, submit updates, and handle password changes, ensuring seamless synchronization between the user interface and the server<br>- Overall, it plays a critical role in the user management workflow by enabling efficient and secure user updates within the application's architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/Update_Users/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator of ongoing processes during user management updates within the settings interface<br>- It ensures users receive immediate feedback while data is loading, enhancing the overall user experience by clearly communicating system activity during asynchronous operations in the frontend application.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.userManagement.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/hook/use-user.ts'>use-user.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a set of React hooks for managing user data within the application, enabling seamless integration with backend APIs for listing, retrieving, creating, updating, deleting, and password management of users<br>- Facilitates user administration workflows, ensuring secure and efficient user account operations aligned with the overall system architecture.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- View_Users Submodule -->
											<details>
												<summary><b>View_Users</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.userManagement.View_Users</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/View_Users/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- The <code>page.tsx</code> file in <code>frontend/app/Features/Settings/userManagement/View_Users/</code> serves as the main interface for viewing detailed user information within the applications user management module<br>- It functions as a dedicated page that retrieves and displays individual user data, integrating navigation and responsive design elements to ensure a seamless user experience across devices<br>- This component plays a crucial role in the overall architecture by enabling administrators or authorized users to access, review, and potentially manage user profiles, thereby supporting the applications broader user management and settings functionalities.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/View_Users/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the user management interface within the settings feature, ensuring a seamless user experience during data loading states<br>- Integrates into the overall frontend architecture by maintaining UI consistency and responsiveness while user data is fetched or processed, supporting smooth navigation and interaction in the user management workflow.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- backup_restore Submodule -->
									<details>
										<summary><b>backup_restore</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Settings.backup_restore</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/backup_restore/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- This code file implements the user interface for the backup and restore functionality within the applications settings section<br>- It provides users with options to manage data backups, including scheduling, manual backups to Google Drive, and restoring data<br>- By integrating with external services like Google Drive and handling sensitive operations such as encryption, this component ensures a secure and user-friendly experience for data management, aligning with the overall architectures focus on reliable, accessible, and secure data handling workflows.</td>
												</tr>
											</table>
											<!-- hook Submodule -->
											<details>
												<summary><b>hook</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Settings.backup_restore.hook</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/backup_restore/hook/use-BackupRestoreAPI.ts'>use-BackupRestoreAPI.ts</a></b></td>
															<td style='padding: 8px;'>- Provides core functionalities for backing up and restoring application data, including local file downloads, encryption/decryption, and cloud integration via Google Drive<br>- Facilitates secure data management by enabling users to export, import, and synchronize backups seamlessly, ensuring data integrity and security within the overall architecture of the applications settings and data persistence layer.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/backup_restore/hook/useBackupSchedule.ts'>useBackupSchedule.ts</a></b></td>
															<td style='padding: 8px;'>- Provides mechanisms to retrieve and update backup scheduling configurations within the application<br>- Facilitates seamless management of backup frequency and timing, integrating with backend APIs to ensure data consistency<br>- Supports the overall data protection architecture by enabling user-specific backup preferences to be dynamically fetched and modified, contributing to reliable and customizable backup workflows.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- Supplier Submodule -->
							<details>
								<summary><b>Supplier</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Supplier</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>frontend/app/Features/Supplier/page.tsx</code> file serves as the main interface for managing supplier data within the application<br>- It provides a user-centric view that enables users to view, search, edit, and delete supplier records<br>- This component integrates with backend APIs to fetch and manipulate supplier information, ensuring real-time updates and data consistency<br>- Overall, it acts as the central hub for supplier-related operations, supporting the broader architecture by facilitating seamless data interaction and user engagement in the supplier management workflow.</td>
										</tr>
									</table>
									<!-- View_Supplier Submodule -->
									<details>
										<summary><b>View_Supplier</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Supplier.View_Supplier</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/View_Supplier/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Displays detailed information about a specific supplier, including contact details, supplies, and timestamps, within the applications supplier management architecture<br>- Facilitates viewing, editing, and navigation actions, integrating seamlessly with the overall supplier data flow and user interface for comprehensive supplier profile management.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/View_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a placeholder component for the supplier view loading state within the frontend application<br>- It ensures a seamless user experience during data fetching or component loading phases by maintaining layout consistency without displaying any visual content<br>- This minimal implementation supports the overall architecture by managing asynchronous UI states efficiently in the supplier management workflow.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- hook Submodule -->
									<details>
										<summary><b>hook</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Supplier.hook</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/hook/useSupplierAPI.ts'>useSupplierAPI.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a set of React hooks for managing supplier data through API interactions, enabling seamless retrieval, creation, updating, deletion, and listing of suppliers within the application<br>- Facilitates integration with backend services to maintain up-to-date supplier information, supporting the overall architectures data consistency and user interface responsiveness.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- Update_Supplier Submodule -->
									<details>
										<summary><b>Update_Supplier</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Supplier.Update_Supplier</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/Update_Supplier/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- This code file defines the EditSupplier component within the frontend application's supplier management feature<br>- Its primary purpose is to facilitate the editing of supplier details by fetching existing supplier data, presenting it in an interactive form, and handling updates<br>- As part of the overall architecture, it enables seamless user interactions for supplier data modification, integrating with backend APIs and maintaining consistent navigation and responsive design<br>- This component plays a crucial role in the supplier management workflow, ensuring users can efficiently update supplier information within the larger system.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/Update_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during the supplier update process within the frontend application<br>- It ensures users receive immediate feedback while data is loading, enhancing the overall user experience<br>- As part of the supplier management feature, it supports seamless interactions by signaling ongoing operations during supplier data updates.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- Add_Supplier Submodule -->
									<details>
										<summary><b>Add_Supplier</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Supplier.Add_Supplier</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/Add_Supplier/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- This code file defines the Add Supplier page within the frontend application, serving as the user interface for creating new supplier entries<br>- It facilitates capturing supplier details through a form, managing user input, validation, and submission processes<br>- Overall, it enables users to seamlessly add new suppliers to the system, integrating with backend APIs to update the application's supplier data repository<br>- This component plays a crucial role in the supplier management workflow, ensuring data consistency and user-friendly interaction within the larger architecture.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- Inventory Submodule -->
							<details>
								<summary><b>Inventory</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Inventory</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides the main interface for inventory management within the application, enabling users to navigate between different inventory views such as master, daily, and surplus stock<br>- It offers a visually engaging dashboard with quick access buttons, facilitating efficient oversight and operational control over various inventory categories in the overall architecture.</td>
										</tr>
									</table>
									<!-- Master_Inventory Submodule -->
									<details>
										<summary><b>Master_Inventory</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Inventory.Master_Inventory</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Inventory Master PageThis file defines the main interface for managing inventory items within the application<br>- It provides users with a comprehensive view of the inventory, including functionalities for searching, filtering, sorting, and performing actions such as editing or deleting inventory records<br>- The page integrates various UI components and hooks to fetch and display inventory data, ensuring a responsive and user-friendly experience<br>- Overall, it serves as the central hub for inventory management, enabling efficient oversight and updates of stock information within the broader system architecture.</td>
												</tr>
											</table>
											<!-- Add_Inventory Submodule -->
											<details>
												<summary><b>Add_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Master_Inventory.Add_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/Add_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- Add Inventory Item PageThis code file defines the Add Inventory Item" page within the inventory management feature of the application<br>- Its primary purpose is to facilitate the creation of new inventory entries by providing a user interface for inputting item details, managing form state, and handling user interactions<br>- As part of the larger architecture, it integrates with inventory and settings APIs to fetch necessary data and submit new inventory records, ensuring seamless data flow within the inventory management system<br>- This page serves as a critical component for users to efficiently add and categorize inventory items, supporting the overall goal of maintaining an organized and up-to-date inventory database.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- View_Inventory Submodule -->
											<details>
												<summary><b>View_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Master_Inventory.View_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/View_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- This code file defines the ViewInventoryItem component, which serves as the primary interface for viewing detailed information about a specific inventory item within the application's inventory management module<br>- Positioned within the frontend's feature architecture, it facilitates user interaction by fetching and displaying comprehensive inventory data, enabling users to review item details seamlessly<br>- This component integrates with authentication, routing, and API layers to ensure secure and dynamic data presentation, thereby supporting the overall architecture's goal of providing an intuitive and responsive inventory management experience.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/View_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the inventory views loading state within the Master Inventory feature<br>- It ensures a seamless user experience by maintaining layout consistency during data fetching or processing, supporting the overall architectures focus on modular, responsive, and user-friendly inventory management workflows.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- Update_Inventory Submodule -->
											<details>
												<summary><b>Update_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Master_Inventory.Update_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/Update_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- This code file defines the user interface for editing inventory items within the applications inventory management feature<br>- It provides a dedicated page that enables users to view, modify, and save details of individual inventory entries, facilitating efficient inventory updates<br>- Positioned within the larger architecture, it integrates seamlessly with the inventory API layer to fetch existing item data and persist changes, supporting the overall goal of maintaining accurate and up-to-date inventory records across the system.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/Update_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during inventory update processes within the Master Inventory feature, enhancing user experience by signaling ongoing loading states<br>- Integrates seamlessly into the frontend architecture, ensuring consistent feedback during asynchronous operations in the inventory management workflow<br>- This component helps maintain user engagement and clarity while data is being fetched or processed.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- hook Submodule -->
									<details>
										<summary><b>hook</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Inventory.hook</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/hook/use-inventoryAPI.ts'>use-inventoryAPI.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a comprehensive hook for managing inventory data across multiple categories, including current stock, todays inventory, and surplus items<br>- Facilitates CRUD operations and transfers between categories, enabling seamless synchronization with backend APIs<br>- Integrates inventory workflows into the frontend architecture, supporting real-time updates and efficient inventory management within the overall system.</td>
												</tr>
											</table>
										</blockquote>
									</details>
									<!-- Today_Inventory Submodule -->
									<details>
										<summary><b>Today_Inventory</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Inventory.Today_Inventory</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- This code file defines the Today Inventory page within the inventory management feature of the application<br>- Its primary purpose is to display, manage, and interact with the current day's inventory data, providing users with real-time insights and control over inventory items<br>- It integrates various UI components, icons, and hooks to facilitate functionalities such as searching, filtering, sorting, and editing inventory records<br>- Overall, this page serves as a centralized interface for users to monitor and perform actions on today's inventory, seamlessly connecting to backend APIs and maintaining state to ensure an up-to-date and user-friendly experience within the broader inventory management architecture.</td>
												</tr>
											</table>
											<!-- Update_Today_Inventory Submodule -->
											<details>
												<summary><b>Update_Today_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Today_Inventory.Update_Today_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/Update_Today_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- Page.tsx`-Today Inventory Item Update PageThis component serves as the main interface for viewing and editing inventory data specific to the current day within the applications inventory management system<br>- It provides users with a streamlined, interactive experience to update today's inventory items, ensuring real-time accuracy and consistency across the platform<br>- By integrating navigation, API interactions, and user feedback mechanisms, this page plays a crucial role in maintaining up-to-date inventory records, supporting the broader architecture's goal of efficient stock management and operational visibility.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/Update_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during data loading processes within the Inventory management feature<br>- It ensures users receive immediate feedback while inventory data for the current day is being fetched or updated, enhancing user experience by signaling ongoing background operations in the inventory update workflow.</td>
														</tr>
													</table>
												</blockquote>
											</details>
											<!-- View_Today_Inventory Submodule -->
											<details>
												<summary><b>View_Today_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Today_Inventory.View_Today_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/View_Today_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- Page.tsx<code> in </code>View_Today_Inventory`This component serves as the main interface for viewing todays inventory within the application<br>- It orchestrates the display of inventory data specific to the current day, integrating user authentication, navigation, and responsive layout components<br>- By leveraging custom hooks and context, it ensures that users can seamlessly access and interact with up-to-date inventory information, tailored to their roles and device types<br>- Overall, this file acts as the central hub for presenting real-time inventory insights, supporting efficient inventory management workflows within the broader architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/View_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the Today Inventory view during loading states, ensuring a seamless user experience by maintaining layout consistency while inventory data is being fetched<br>- Integrates into the overall inventory management interface within the frontend application, supporting smooth transitions and improved responsiveness during data retrieval processes.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
									<!-- Surplus_Inventory Submodule -->
									<details>
										<summary><b>Surplus_Inventory</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Inventory.Surplus_Inventory</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Surplus_Inventory/page.tsx'>page.tsx</a></b></td>
													<td style='padding: 8px;'>- Surplus Inventory PageThis file defines the Surplus Inventory page within the Inventory feature of the application<br>- Its primary purpose is to provide a comprehensive interface for viewing, managing, and interacting with surplus inventory data<br>- The page integrates various UI components, icons, and hooks to facilitate functionalities such as searching, filtering, sorting, and performing actions (e.g., editing or deleting surplus inventory items)<br>- It acts as a central hub for users to efficiently oversee surplus stock, ensuring smooth inventory management workflows within the broader application architecture.</td>
												</tr>
											</table>
											<!-- View_Surplus_Inventory Submodule -->
											<details>
												<summary><b>View_Surplus_Inventory</b></summary>
												<blockquote>
													<div class='directory-path' style='padding: 8px 0; color: #666;'>
														<code><b>⦿ frontend.app.Features.Inventory.Surplus_Inventory.View_Surplus_Inventory</b></code>
													<table style='width: 100%; border-collapse: collapse;'>
													<thead>
														<tr style='background-color: #f8f9fa;'>
															<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
															<th style='text-align: left; padding: 8px;'>Summary</th>
														</tr>
													</thead>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory/page.tsx'>page.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a detailed view of individual surplus inventory items, enabling users to access comprehensive information such as item details, stock status, and timestamps<br>- Integrates data fetching, formatting, and user navigation to support inventory management workflows within the broader application architecture<br>- Enhances user experience by presenting organized, real-time inventory insights and facilitating seamless navigation.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the surplus inventory view, ensuring a seamless user experience during data loading states within the inventory management feature<br>- It integrates into the overall frontend architecture, supporting smooth transitions and maintaining interface consistency while inventory data is fetched or processed.</td>
														</tr>
													</table>
												</blockquote>
											</details>
										</blockquote>
									</details>
								</blockquote>
							</details>
							<!-- Dashboard Submodule -->
							<details>
								<summary><b>Dashboard</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.Features.Dashboard</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/page.tsx'>page.tsx</a></b></td>
											<td style='padding: 8px;'>- The <code>page.tsx</code> file in the Dashboard feature serves as the central component for rendering the user’s dashboard interface<br>- It orchestrates the display of key business metrics, including sales trends, inventory status, and product performance, by integrating various data sources and visualizations<br>- This component provides users with an at-a-glance overview of sales predictions, stock levels, and operational alerts, facilitating informed decision-making<br>- Overall, it acts as the primary user interface for monitoring and analyzing critical business data within the applications architecture.</td>
										</tr>
									</table>
									<!-- hook Submodule -->
									<details>
										<summary><b>hook</b></summary>
										<blockquote>
											<div class='directory-path' style='padding: 8px 0; color: #666;'>
												<code><b>⦿ frontend.app.Features.Dashboard.hook</b></code>
											<table style='width: 100%; border-collapse: collapse;'>
											<thead>
												<tr style='background-color: #f8f9fa;'>
													<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
													<th style='text-align: left; padding: 8px;'>Summary</th>
												</tr>
											</thead>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/useMultiSalesPrediction.ts'>useMultiSalesPrediction.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a custom React hook for fetching and managing multi-timeframe sales prediction data, including daily, weekly, and monthly forecasts<br>- Facilitates asynchronous data retrieval, state management, and error handling to support dynamic sales insights within the dashboard, enabling users to visualize top sales predictions across different periods seamlessly.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/use-dashboardAPI.ts'>use-dashboardAPI.ts</a></b></td>
													<td style='padding: 8px;'>- Provides custom hooks for fetching key inventory insights, including low stock, expiring, and surplus ingredients, from the backend API<br>- These hooks streamline data retrieval for the dashboard, enabling real-time monitoring and management of inventory levels within the applications architecture<br>- They facilitate seamless integration of inventory status updates into the user interface.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/useSalesPrediction.ts'>useSalesPrediction.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a React hook for fetching and managing weekly or top sales prediction data from an API, enabling dynamic updates and error handling within the dashboard<br>- It facilitates seamless integration of sales forecasts into the user interface, supporting data-driven decision-making and enhancing the overall analytics capabilities of the application.</td>
												</tr>
											</table>
										</blockquote>
									</details>
								</blockquote>
							</details>
						</blockquote>
					</details>
					<!-- routes Submodule -->
					<details>
						<summary><b>routes</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.routes</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/routes/routes.ts'>routes.ts</a></b></td>
									<td style='padding: 8px;'>- Defines centralized URL routes for the applications navigation, enabling consistent and maintainable access to various features and pages within the frontend architecture<br>- Facilitates seamless routing management across inventory, reports, user management, and settings modules, supporting scalable and organized navigation flow throughout the project.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- lib Submodule -->
					<details>
						<summary><b>lib</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.lib</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/loadingSetter.ts'>loadingSetter.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates centralized management of loading state within the frontend application by allowing registration of a loading setter function and enabling other components to trigger loading state updates<br>- This approach ensures consistent user experience during asynchronous operations, integrating seamlessly into the overall architecture to coordinate UI feedback across different parts of the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/index.ts'>index.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates consistent class name management across the frontend application by re-exporting a utility function from the utils module<br>- Integrates seamlessly into the project’s architecture, promoting cleaner code and easier styling practices within the app’s component structure<br>- Enhances maintainability and readability by centralizing class name handling in the app’s core library.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/utils.ts'>utils.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a utility function to concatenate multiple class names into a single string, filtering out falsy values<br>- It streamlines dynamic styling within the frontend application, supporting consistent and conditional class application across components<br>- This enhances the maintainability and readability of styling logic within the overall frontend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/axios.ts'>axios.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized Axios instance configured for robust API communication within the frontend architecture<br>- It manages request retries, handles authentication tokens, and standardizes error and success notifications, ensuring seamless user experience and reliable server interactions across the application<br>- This setup enhances maintainability and consistency in handling API requests throughout the codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/loadingHandler.ts'>loadingHandler.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates global management of loading states within the frontend application, enabling seamless user experience during asynchronous operations<br>- Integrates with the centralized loadingSetter to toggle loading indicators, supporting consistent visual feedback across various components<br>- Enhances the overall architecture by providing a unified interface for handling loading status, ensuring smooth interactions and improved responsiveness throughout the user interface.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- hooks Submodule -->
					<details>
						<summary><b>hooks</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.hooks</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/hooks/usePWA.ts'>usePWA.ts</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive hooks for managing Progressive Web App (PWA) features, including installation, offline actions, network status, and push notifications<br>- Facilitates seamless PWA integration within the application, enabling users to install the app, handle offline data synchronization, and receive notifications, thereby enhancing user engagement and resilience in varying network conditions.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/hooks/usePWAData.ts'>usePWAData.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a comprehensive React hook for managing Progressive Web App data, enabling seamless caching, offline support, and synchronization<br>- It automates data fetching, caching, and updates while handling offline actions and stale data alerts, ensuring reliable user experiences across online and offline states within the applications architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- resetPassword Submodule -->
					<details>
						<summary><b>resetPassword</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.resetPassword</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/resetPassword/page.tsx'>page.tsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user password recovery by providing a user interface for submitting email addresses to trigger password reset links via Supabase authentication<br>- Integrates seamlessly into the authentication flow, enabling users to initiate password resets and receive instructions, thereby enhancing account security and user experience within the overall application architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- context Submodule -->
					<details>
						<summary><b>context</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.context</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/context/LoadingContext.tsx'>LoadingContext.tsx</a></b></td>
									<td style='padding: 8px;'>- Establishes a centralized loading state management system within the frontend architecture, enabling consistent control and indication of loading status across various components<br>- Facilitates seamless user experience by providing a shared context for toggling loading indicators, ensuring synchronized UI feedback during asynchronous operations throughout the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/context/AuthContext.tsx'>AuthContext.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides user authentication management within the application by maintaining session state, handling login status, and role-based access control<br>- Integrates with Supabase for session validation and synchronizes user data with backend APIs, ensuring secure and seamless user experiences across the apps architecture<br>- Acts as a central context for authentication state, enabling consistent access control throughout the frontend.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- utils Submodule -->
					<details>
						<summary><b>utils</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ frontend.app.utils</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/pwa.ts'>pwa.ts</a></b></td>
									<td style='padding: 8px;'>- Provides core Progressive Web App (PWA) functionalities, including installation prompts, offline support, network status monitoring, background synchronization, and push notifications<br>- These utilities enable the application to deliver a seamless, resilient user experience across various devices and network conditions, integrating essential PWA features into the overall architecture of Cardiac Delights.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/_app.tsx'>_app.tsx</a></b></td>
									<td style='padding: 8px;'>- Establishes the global application structure by integrating authentication context across all pages, ensuring consistent user state management throughout the frontend<br>- Facilitates seamless access to authentication data and functions, supporting secure and cohesive user experiences within the overall architecture of the Next.js application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/pwaCache.ts'>pwaCache.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a comprehensive utility for managing Progressive Web App (PWA) caching strategies, enabling efficient storage, retrieval, and invalidation of various data types in local storage<br>- Facilitates optimized data freshness and performance by implementing configurable cache durations tailored to different data categories, supporting seamless offline access and improved user experience within the overall application architecture.</td>
								</tr>
							</table>
							<!-- API Submodule -->
							<details>
								<summary><b>API</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.utils.API</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/API/LoginAPI.ts'>LoginAPI.ts</a></b></td>
											<td style='padding: 8px;'>- Provides authentication functionalities by managing user login and logout processes through API interactions<br>- Facilitates secure token handling and session management within the frontend application, supporting seamless user authentication flow as part of the overall architecture<br>- Ensures reliable communication with backend authentication endpoints, maintaining consistent user state across the application.</td>
										</tr>
									</table>
								</blockquote>
							</details>
							<!-- Server Submodule -->
							<details>
								<summary><b>Server</b></summary>
								<blockquote>
									<div class='directory-path' style='padding: 8px 0; color: #666;'>
										<code><b>⦿ frontend.app.utils.Server</b></code>
									<table style='width: 100%; border-collapse: collapse;'>
									<thead>
										<tr style='background-color: #f8f9fa;'>
											<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
											<th style='text-align: left; padding: 8px;'>Summary</th>
										</tr>
									</thead>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/Server/supabaseClient.js'>supabaseClient.js</a></b></td>
											<td style='padding: 8px;'>- Establishes a centralized Supabase client for seamless backend communication within the frontend application<br>- Facilitates secure data operations, authentication, and real-time updates by connecting to the Supabase backend service<br>- Integrates environment variables to ensure configuration flexibility across different deployment environments, supporting the overall architectures modular and scalable design.</td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/requirements.txt'>requirements.txt</a></b></td>
					<td style='padding: 8px;'>- Defines project dependencies and environment configurations essential for backend operations<br>- Ensures consistent setup across development and deployment environments, supporting core functionalities such as API interactions, authentication, data processing, and third-party integrations<br>- Serves as the foundation for maintaining stability and compatibility within the overall architecture.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/credentials.json'>credentials.json</a></b></td>
							<td style='padding: 8px;'>- Facilitates secure OAuth 2.0 authentication with Google, enabling user login and authorization within the application<br>- Integrates Google’s authentication services into the overall architecture, supporting user identity management and access control for the platform<br>- Ensures seamless and secure user onboarding by leveraging Google credentials as part of the system’s authentication flow.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/main.py'>main.py</a></b></td>
							<td style='padding: 8px;'>- Establishes the core API infrastructure for the inventory management system, integrating various functional modules such as sales, inventory, user management, and reporting<br>- Sets up routing, middleware, scheduled background tasks, and error handling to ensure seamless, secure, and reliable communication between clients and backend services, supporting overall system stability and operational automation.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/supabase.py'>supabase.py</a></b></td>
							<td style='padding: 8px;'>- Establishes core backend integrations by configuring the Supabase client for external service interactions and setting up asynchronous access to the PostgreSQL database<br>- Facilitates seamless data operations and external API communication, serving as a foundational component that supports data management, authentication, and real-time features within the overall architecture.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/users.py'>users.py</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive user management functionalities within the backend architecture, including retrieving, creating, updating, deleting, and resetting passwords for users<br>- Integrates with Supabase for data storage and authentication, while maintaining activity logs for audit purposes<br>- Ensures role-based access control and synchronization between user data and authentication records, supporting secure and organized user lifecycle operations across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/rolebasedAccess.py'>rolebasedAccess.py</a></b></td>
									<td style='padding: 8px;'>- Defines role-based access control endpoints for managing inventory, menu, suppliers, reports, settings, and user sessions within the application<br>- Enforces permissions based on user roles, ensuring secure and appropriate access to various functionalities across the system<br>- Serves as a central authorization layer, maintaining security and operational integrity in the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/userActivity.py'>userActivity.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for recording and retrieving user activity logs within the backend architecture<br>- Facilitates tracking user actions, storing activity details, and enabling filtered retrieval by user ID, supporting auditability and user behavior analysis across the system<br>- Integrates with the database layer to ensure persistent, organized activity data management.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/menu.py'>menu.py</a></b></td>
									<td style='padding: 8px;'>- This code file defines API routes for managing menu items within the applications backend architecture<br>- Its primary purpose is to facilitate the creation of new menu entries, including uploading associated images and specifying ingredients, in a single, streamlined request<br>- By integrating role-based access control, it ensures that only authorized users such as Owners, General Managers, or Store Managers can perform these operations<br>- Overall, this module plays a crucial role in enabling dynamic menu management and content updates, supporting the broader systems goal of flexible and secure restaurant or store menu administration.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/auth_routes.py'>auth_routes.py</a></b></td>
									<td style='padding: 8px;'>- Defines authentication endpoints for user login, session validation, and logout, integrating Supabase for user data management and activity logging<br>- Facilitates secure token validation, user information retrieval, and activity tracking, ensuring seamless user authentication flow within the applications architecture<br>- Enhances security, user experience, and auditability across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/automaticbackup.py'>automaticbackup.py</a></b></td>
									<td style='padding: 8px;'>- Implements automated backup scheduling for the application, enabling users to configure periodic database backups stored locally and uploaded to Google Drive<br>- Manages schedule creation, updates, and execution through API endpoints, integrating time format conversions and leveraging a background scheduler to ensure reliable, customizable backup routines aligned with user preferences.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory.py'>inventory.py</a></b></td>
									<td style='padding: 8px;'>- The <code>inventory.py</code> file serves as the core API layer for managing inventory items within the application<br>- Its primary purpose is to facilitate the retrieval, creation, updating, and status assessment of inventory data, ensuring that stock levels are accurately monitored and maintained<br>- This module integrates with the broader system to support inventory oversight, trigger stock status recalculations, and enforce role-based access controls, thereby maintaining data integrity and operational efficiency across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_settings.py'>inventory_settings.py</a></b></td>
									<td style='padding: 8px;'>- Manages CRUD operations for inventory settings within the application, enabling authorized users to create, retrieve, update, and delete inventory configuration data<br>- Integrates activity logging to track user actions, supporting auditability and accountability<br>- Serves as a core component for maintaining consistent inventory parameters across the system, facilitating effective inventory management and operational oversight.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/supplier.py'>supplier.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing supplier data within the application, enabling creation, retrieval, updating, and deletion of supplier records<br>- Integrates role-based access control and activity logging to ensure secure operations and maintain audit trails, supporting the broader system architectures focus on supplier management and user accountability.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_log.py'>inventory_log.py</a></b></td>
									<td style='padding: 8px;'>- Provides API endpoints for managing inventory logs, enabling insertion of new log entries and retrieval of existing logs within specified date ranges<br>- Facilitates tracking inventory changes, recording stock adjustments, and querying historical data to support inventory management and reporting within the broader system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/notification.py'>notification.py</a></b></td>
									<td style='padding: 8px;'>- Manages user notifications and alert settings within the application, enabling retrieval, updates, and creation of notifications related to inventory status such as low stock and expiring items<br>- Facilitates automated and manual inventory checks, ensuring users receive timely alerts through preferred methods, and maintains notification history to support effective inventory management and user engagement.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/dashboard.py'>dashboard.py</a></b></td>
									<td style='padding: 8px;'>- Provides API endpoints for dashboard metrics, including low stock inventory, expiring ingredients within a configurable timeframe, and surplus ingredients<br>- Facilitates real-time inventory monitoring and alerts, supporting efficient stock management and decision-making within the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_report.py'>sales_report.py</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive API endpoints for generating detailed sales analytics, including summaries, item breakdowns, temporal trends, top performers, hourly data, and period comparisons<br>- Facilitates data-driven decision-making by aggregating and analyzing sales data from the database, supporting various reporting needs within the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/backup_restore.py'>backup_restore.py</a></b></td>
									<td style='padding: 8px;'>- This code file serves as the core module for managing data backup and restoration within the applications architecture<br>- It facilitates secure, automated backups of critical database tables and application data, integrating with Google Drive for cloud storage<br>- Additionally, it provides mechanisms for restoring data from backups, ensuring data integrity and continuity<br>- By orchestrating interactions between the database, cloud storage, and user activity logging, this module plays a pivotal role in maintaining data resilience and supporting operational recovery processes across the entire system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_prediction.py'>sales_prediction.py</a></b></td>
									<td style='padding: 8px;'>- Provides an API endpoint for predicting top-selling items based on recent sales data<br>- Utilizes historical order data to identify leading products and forecasts future sales using Prophet, enabling data-driven inventory and sales planning within the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/resetpass.py'>resetpass.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates password reset functionality by handling user requests to initiate password recovery<br>- It generates reset links and dispatches email notifications through SMTP, integrating seamlessly into the authentication flow of the overall application architecture<br>- This component ensures users can securely request password resets, supporting user account management and security protocols within the system.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/models/base.py'>base.py</a></b></td>
									<td style='padding: 8px;'>- Defines the foundational ORM model class for the applications database layer, establishing a common base for all database models within the backend architecture<br>- Facilitates consistent schema definitions and interactions with the database through SQLAlchemy, supporting the overall modular and scalable design of the backend system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/models/userModal.py'>userModal.py</a></b></td>
									<td style='padding: 8px;'>- Defines the User model within the database schema, representing user entities and their attributes<br>- It facilitates user data management, including authentication identifiers, personal details, and roles, serving as a core component for user-related operations and interactions within the applications backend architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- services Submodule -->
					<details>
						<summary><b>services</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ backend.app.services</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/auth_service.py'>auth_service.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates user authentication by interfacing with Supabases authentication API, enabling secure login functionality within the backend architecture<br>- Integrates seamlessly with the overall system to verify user credentials, supporting the applications authentication flow and ensuring protected access to resources<br>- Serves as a core component for managing user sessions and maintaining security standards across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/user_activity_log_service.py'>user_activity_log_service.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates logging and retrieval of user activity data within the application, supporting audit trails and user behavior analysis<br>- Integrates with the database to record user actions, filter logs based on various criteria, and ensure accurate activity tracking aligned with the overall system architecture<br>- Enhances transparency and accountability across user interactions.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/example_service.py'>example_service.py</a></b></td>
									<td style='padding: 8px;'>- Provides an asynchronous service function to retrieve example data within the backend architecture<br>- It facilitates data fetching operations, supporting the overall API functionality by delivering a simple message endpoint<br>- This component integrates into the larger FastAPI application, enabling modular and scalable data access for client interactions.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- utils Submodule -->
					<details>
						<summary><b>utils</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ backend.app.utils</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/utils/rbac.py'>rbac.py</a></b></td>
									<td style='padding: 8px;'>- Implements role-based access control (RBAC) by authenticating users through JWT tokens and verifying their permissions against stored user roles in the database<br>- Facilitates secure endpoint protection within the application, ensuring only authorized users with appropriate roles can access specific resources, thereby maintaining the overall security and integrity of the system.</td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/Database/schema.sql'>schema.sql</a></b></td>
					<td style='padding: 8px;'>- Defines the database schema for managing core entities such as users, inventory, orders, menus, ingredients, food trends, and backup history<br>- Facilitates data organization, relationships, and constraints essential for supporting restaurant operations, inventory tracking, trend analysis, and user activity logging within the overall system architecture.</td>
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

Build Capstone-Project from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/AcsOfficial/Capstone-Project
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd Capstone-Project
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

Capstone-project uses the {__test_framework__} test framework. Run the test suite with:

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

- **💬 [Join the Discussions](https://github.com/AcsOfficial/Capstone-Project/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/AcsOfficial/Capstone-Project/issues)**: Submit bugs found or log feature requests for the `Capstone-Project` project.
- **💡 [Submit Pull Requests](https://github.com/AcsOfficial/Capstone-Project/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/AcsOfficial/Capstone-Project
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

Capstone-project is protected under the [LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

## ✨ Acknowledgments

- Credit `contributors`, `inspiration`, `references`, etc.

<div align="left"><a href="#top">⬆ Return</a></div>

---
