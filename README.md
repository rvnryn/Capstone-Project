<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="left">

# CAPSTONE-PROJECT

<em>Transforming Ideas Into Impactful Realities</em>

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

Capstone-Project is a comprehensive full-stack development toolkit designed to streamline building secure, interactive web applications with offline capabilities. The core features include:

- 🛠️ **Role-based Access Control:** Ensures secure, permission-driven user interactions across the platform.
- 🌐 **Progressive Web App (PWA) Support:** Enables offline access, smart caching, and real-time synchronization for a seamless user experience.
- ☁️ **Automated Cloud Backups:** Facilitates scheduled backups to Google Drive, safeguarding data integrity and recovery.
- 🎨 **Modular UI Components:** Provides reusable, styled React components for consistent and maintainable frontend design.
- 🔒 **Secure Authentication:** Integrates with Supabase for real-time user management, authentication, and session handling.
- ⚙️ **Extensive API & Utilities:** Offers a rich set of API routes, hooks, and utilities to simplify data management and backend integration.

---

## 📌 Features

|      | Component            | Details                                                                                     |
| :--- | :------------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**     | <ul><li>Full-stack web app with React frontend and Python backend</li><li>RESTful API design</li><li>Separation of concerns between UI, API, and database layers</li></ul> |
| 🔩 | **Code Quality**     | <ul><li>Consistent code style with ESLint and Prettier</li><li>TypeScript used for frontend with strict type checks</li><li>Python backend with PEP8 adherence</li></ul> |
| 📄 | **Documentation**    | <ul><li>Comprehensive README with setup instructions</li><li>API documentation via inline comments and markdown files</li><li>Usage examples included</li></ul> |
| 🔌 | **Integrations**     | <ul><li>Supabase for database and auth</li><li>Axios for HTTP requests</li><li>Chart.js for data visualization</li><li>@react-oauth/google for OAuth</li><li>TailwindCSS for styling</li></ul> |
| 🧩 | **Modularity**       | <ul><li>Frontend components organized in React component hierarchy</li><li>Backend functions modularized with separate API endpoints</li><li>Shared types/interfaces between frontend and backend</li></ul> |
| 🧪 | **Testing**          | <ul><li>Unit tests with Jest for React components</li><li>API tests with Python pytest</li><li>Mocking external services where applicable</li></ul> |
| ⚡️  | **Performance**      | <ul><li>Code splitting with Next.js dynamic imports</li><li>Optimized images and assets</li><li>Client-side caching with SWR and React Query</li></ul> |
| 🛡️ | **Security**         | <ul><li>OAuth 2.0 integration for authentication</li><li>Secure storage of credentials.json</li><li>Input validation and sanitization</li></ul> |
| 📦 | **Dependencies**     | <ul><li>Frontend managed via `package.json` with React, TailwindCSS, Chart.js, Axios</li><li>Backend dependencies via `requirements.txt` including Flask, SQLAlchemy, pytest</li></ul> |

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
					<td style='padding: 8px;'>- Defines project dependencies and development tools, ensuring proper integration of cryptographic functions, animation capabilities, and type support<br>- Serves as the foundation for managing external libraries essential for building secure, interactive, and type-safe features within the overall architecture<br>- Facilitates consistent environment setup and dependency management across the codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides the foundational structure for the Capstone-Project, enabling seamless integration of frontend and backend components<br>- Facilitates core functionalities such as user authentication, data management, and offline support, contributing to a scalable, secure, and responsive web application architecture<br>- Serves as the backbone that ensures cohesive operation across the entire full-stack system.</td>
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
					<td style='padding: 8px;'>- Provides a comprehensive guide for integrating Progressive Web App (PWA) features into various pages, enabling offline support, smart caching, and real-time sync indicators<br>- Facilitates seamless data management by offering reusable hooks and components that enhance user experience through offline accessibility, visual status updates, and automatic data synchronization across the application architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tailwind.config.js'>tailwind.config.js</a></b></td>
					<td style='padding: 8px;'>- Defines custom Tailwind CSS configuration to enhance responsive design and visual consistency across diverse devices and screen orientations<br>- Extends default theme with tailored breakpoints, spacing, font sizes, and border widths, enabling precise styling for ultra-wide, small, and height-constrained screens<br>- Supports adaptive layouts and device-specific UI adjustments within the overall frontend architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/eslint.config.mjs'>eslint.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Defines ESLint configuration tailored for the frontend Next.js project, ensuring code quality and consistency by extending standard web vitals and TypeScript rules<br>- It customizes linting behavior to accommodate project-specific preferences, streamlining development workflows and maintaining code standards across the codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/RESPONSIVE_ARCHITECTURE.md'>RESPONSIVE_ARCHITECTURE.md</a></b></td>
					<td style='padding: 8px;'>- Defines the applications responsive layout architecture, enabling seamless adaptation across mobile, tablet, and desktop devices<br>- Manages device detection, layout adjustments, and component behaviors to ensure optimal user experience, interface consistency, and performance<br>- Facilitates responsive navigation, modals, grids, and content presentation, supporting a cohesive and accessible interface throughout the entire codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Facilitates the frontend applications core user interface and client-side interactions within the overall architecture<br>- It manages user authentication, data visualization, and real-time updates, enabling seamless user experiences<br>- Integrates with backend services like Supabase and external APIs, serving as the primary interface layer that connects users to the systems functionalities.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/postcss.config.mjs'>postcss.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Configure PostCSS to integrate Tailwind CSS styles into the frontend build process, enabling utility-first styling across the application<br>- This setup ensures consistent, scalable styling by leveraging Tailwinds framework within the projects architecture, facilitating efficient UI development and maintaining design coherence throughout the frontend codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/next.config.ts'>next.config.ts</a></b></td>
					<td style='padding: 8px;'>- Defines the Next.js configuration for the frontend application, enabling seamless API proxying to the backend server and configuring remote image hosting<br>- Facilitates smooth integration between frontend and backend services while optimizing image loading from specified external domains, supporting scalable and flexible deployment within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tsconfig.json'>tsconfig.json</a></b></td>
					<td style='padding: 8px;'>- Defines TypeScript compiler options for the frontend project, ensuring consistent, strict, and optimized code development<br>- Facilitates seamless integration with Next.js and modern JavaScript features, supporting efficient build processes and type safety across the applications frontend architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides an overview of the Next.js-based frontend architecture, emphasizing its role in delivering a dynamic, optimized user interface<br>- Facilitates local development and deployment, highlighting integration with modern font optimization and Vercel deployment<br>- Serves as a foundational entry point for building, customizing, and deploying the web application within a scalable, server-rendered environment.</td>
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
							<td style='padding: 8px;'>- Establishes the foundational layout and context for the frontend application by integrating global providers, managing Progressive Web App (PWA) behaviors, and handling service worker registration<br>- Facilitates consistent state management, user authentication, and user experience enhancements such as install prompts, network status indicators, and toast notifications across the entire app.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/layout.tsx'>layout.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the root layout for the Cardiac Delights PWA, establishing global metadata, fonts, and styling<br>- Sets up the foundational HTML structure, including viewport, theme, and icon links, while embedding the AppShell component to ensure consistent layout and navigation across the application<br>- Facilitates responsiveness, offline capabilities, and a cohesive user experience within the overall architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/page.tsx'>page.tsx</a></b></td>
							<td style='padding: 8px;'>- Implements the user login interface, integrating authentication workflows with backend API and Supabase services<br>- Facilitates user credential input, password visibility toggling, and password reset requests, while managing session refresh and navigation upon successful login<br>- Enhances user experience with modals for feedback and error handling, forming a core component of the applications authentication architecture.</td>
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
									<td style='padding: 8px;'>- Provides a global loading overlay that visually indicates ongoing background processes across the application<br>- It enhances user experience by displaying a centered spinner during loading states, ensuring users are aware of background activity without disrupting interaction<br>- Integrates seamlessly with the applications context-driven state management, maintaining consistent feedback during asynchronous operations within the frontend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/loadingscreen.tsx'>loadingscreen.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a full-screen loading indicator with branding for the application, enhancing user experience during data fetches or transitions<br>- It visually communicates ongoing processes while maintaining brand visibility, ensuring users are engaged and informed during wait times within the overall frontend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/ResponsiveMain.tsx'>ResponsiveMain.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a responsive layout wrapper that dynamically adjusts main content margins based on device type, screen size, and menu state<br>- Ensures optimal content presentation across various devices by managing layout shifts and preventing overflow, while handling hydration issues during initial rendering<br>- Integrates seamlessly into the overall architecture to deliver a consistent, adaptable user interface.</td>
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
											<td style='padding: 8px;'>- Defines a set of reusable, styled React components for building consistent card UI elements within the application<br>- These components facilitate the creation of structured, visually cohesive card layouts, including headers, titles, descriptions, content areas, and footers, supporting a modular and maintainable design system across the frontend.</td>
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
											<td style='padding: 8px;'>- Navigation Component (<code>navigation.tsx</code>)This file defines the primary navigation component for the frontend application, orchestrating user interface elements related to site navigation, user authentication, and real-time notifications<br>- It serves as a central hub for managing navigation state, rendering menu options, and integrating with PWA features to enhance user experience<br>- Within the overall architecture, it ensures seamless user flow, context-aware routing, and responsive interactions, contributing to a cohesive and intuitive frontend interface.</td>
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
													<td style='padding: 8px;'>- Provides comprehensive management of navigation and responsive state within the application<br>- It detects device type, screen size, orientation, and accessibility preferences, enabling adaptive UI behavior<br>- Additionally, it handles menu toggling, online status, and PWA mode, ensuring a seamless, accessible, and device-aware user experience across various platforms and devices.</td>
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
											<td style='padding: 8px;'>- Provides user interface components to enhance Progressive Web App (PWA) functionality by enabling installation prompts, monitoring network connectivity, and displaying comprehensive PWA status indicators<br>- These components improve user engagement, offline resilience, and transparency regarding app capabilities, integrating seamlessly into the overall architecture to support a robust, user-friendly PWA experience.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExampleUsage.tsx'>PWAExampleUsage.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements comprehensive Progressive Web App (PWA) features within an inventory management page, enabling smart caching, offline data visibility, real-time sync status, and offline updates<br>- Facilitates seamless user experience by ensuring data persistence, synchronization, and status notifications, serving as a reusable example for integrating PWA capabilities across various pages in the application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAStatus.tsx'>PWAStatus.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides React components to monitor and display the Progressive Web Apps offline and synchronization status<br>- It visually indicates connectivity, cached data freshness, and pending actions, enabling users to understand data sync states and offline activity at a glance<br>- These components enhance user awareness and trust in the app’s offline capabilities within the overall architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExample.tsx'>PWAExample.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a reusable PWA integration component that enhances feature pages with offline support, network status indication, and notification permissions<br>- Facilitates seamless user experiences by enabling offline data queuing, automatic synchronization upon reconnection, and notification management, thereby ensuring robust functionality and improved engagement within the overall application architecture.</td>
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
											<td style='padding: 8px;'>- This code file defines the Report page within the application's frontend architecture, serving as a centralized hub for accessing various analytical reports<br>- It provides users with an intuitive interface to navigate to detailed sales, inventory, and user activity reports, facilitating data-driven decision-making<br>- By integrating role-based navigation and a responsive design, this component enhances user experience and ensures seamless access to critical analytics across the platform.</td>
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
													<td style='padding: 8px;'>- Report Inventory PageThis file defines the main interface for viewing and managing inventory reports within the application<br>- It provides users with a comprehensive dashboard to visualize inventory data, including stock levels, wastage, and expiration details<br>- The page integrates various interactive features such as search, filtering, chart visualizations, and data export capabilities, enabling users to analyze inventory trends and make informed decisions<br>- Overall, it serves as the central hub for inventory reporting, connecting backend data sources with an intuitive frontend experience to facilitate effective inventory management.</td>
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
															<td style='padding: 8px;'>- Provides an API hook for managing inventory logs, enabling fetching and updating inventory data within the application<br>- Facilitates seamless integration with backend inventory log endpoints, supporting date-range queries and batch updates<br>- This module centralizes inventory log interactions, ensuring consistent data handling and simplifying state management across the frontend inventory reporting features.</td>
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
													<td style='padding: 8px;'>- Report_Sales PageThis file serves as the main interface for the Sales Report feature within the application<br>- It orchestrates the presentation and interaction logic for viewing, filtering, and exporting sales data<br>- The page integrates with Google Sheets to fetch sales data, enabling users to seamlessly import and analyze sales reports directly from their Google spreadsheets<br>- It also provides functionalities such as data visualization, filtering, and exporting to Excel, supporting informed decision-making and streamlined reporting workflows within the broader application architecture.</td>
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
															<td style='padding: 8px;'>- Provides centralized access to sales reporting functionalities within the frontend architecture, enabling comprehensive and simplified retrieval of sales data<br>- Facilitates integration of detailed sales metrics, performance insights, and comparison analyses, supporting data-driven decision-making across the application<br>- Serves as a key interface for leveraging sales analytics features in various components and user interfaces.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSimpleSalesReport.ts'>useSimpleSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a hook for fetching and managing simplified sales report data across various timeframes<br>- It consolidates key metrics such as revenue, orders, top items, and daily sales, enabling seamless integration of sales insights into the applications user interface<br>- This component supports dynamic data retrieval, error handling, and state management to facilitate real-time sales analysis within the overall architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSalesReport.ts'>useSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a comprehensive hook for fetching, managing, and formatting sales report data within the frontend architecture<br>- It centralizes API interactions for sales summaries, item performance, time-based trends, and comparisons, enabling seamless integration of sales analytics into the user interface<br>- Facilitates efficient state handling and data presentation for sales insights across the application.</td>
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
													<td style='padding: 8px;'>- Report_UserActivity PageThis file defines the main user interface for the User Activity Report" feature within the application<br>- It provides a comprehensive dashboard that enables users to view, filter, and analyze user activity data<br>- The page integrates various interactive components such as search, date filtering, and data visualization tools, facilitating in-depth insights into user engagement patterns<br>- Additionally, it supports exporting data to Excel and integrates with Google Sheets for data sharing and collaboration<br>- Overall, this component serves as the central hub for monitoring and reporting user activity, aligning with the application's broader architecture of data-driven decision-making and user analytics.</td>
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
															<td style='padding: 8px;'>- Provides a hook for managing user activity logs within the application, enabling fetching and creating activity records through API interactions<br>- Facilitates tracking user actions, roles, and timestamps, supporting audit and reporting functionalities across the platforms architecture<br>- Enhances observability and user behavior analysis by integrating seamlessly with backend services.</td>
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
											<td style='padding: 8px;'>- Frontend/app/Features/Menu/page.tsx`This component serves as the main interface for managing menu items within the application<br>- It provides users with a comprehensive view of the menu, including details such as dish ID, name, image, category, price, and stock status<br>- The page enables users to perform actions like viewing, editing, and deleting menu items, facilitating efficient menu management<br>- It integrates with backend APIs to fetch and manipulate menu data, ensuring real-time updates and synchronization<br>- Overall, this file plays a central role in the user experience for menu administration, supporting the broader architecture of the application’s content management and user interaction workflows.</td>
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
													<td style='padding: 8px;'>- Frontend/app/Features/Menu/Update_Menu/page.tsx`This component serves as the main interface for editing a specific menu within the application<br>- It enables users to view, modify, and manage menu details, including updating images and ingredients<br>- By integrating with backend APIs, it ensures that menu changes are persisted and reflected across the platform<br>- Positioned within the applications feature-specific architecture, this page facilitates seamless menu management, supporting dynamic updates and user interactions to maintain an up-to-date menu catalog.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/Update_Menu/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during menu update operations within the frontend application<br>- It ensures users receive immediate feedback while the system processes changes, enhancing user experience and interface responsiveness<br>- As part of the overall architecture, it supports seamless interactions during asynchronous menu modifications, maintaining clarity and engagement during loading states.</td>
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
													<td style='padding: 8px;'>- ViewMenu ComponentThis component serves as the main interface for viewing detailed information about a specific menu within the application<br>- It orchestrates data retrieval, user navigation, and conditional rendering to provide users with an organized and interactive view of menu details<br>- By integrating authentication context, routing, and API hooks, it ensures that users can access and interact with menu data seamlessly, supporting the overall architectures goal of delivering a dynamic and user-centric experience for menu management.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/View_Menu/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a placeholder component for the menu loading state within the frontend application<br>- It ensures a seamless user experience by maintaining layout consistency during data fetches or asynchronous operations related to menu display, supporting smooth navigation and interaction within the overall feature architecture.</td>
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
													<td style='padding: 8px;'>- Add_Menu PageThis component provides the user interface for adding a new menu item within the application<br>- It facilitates inputting dish details such as name, category, and price, as well as uploading an image and managing associated ingredients<br>- Serving as a key part of the menu management workflow, it enables users to create and submit new menu entries seamlessly, integrating with backend APIs to persist data<br>- Overall, this page enhances the applications ability to dynamically manage menu content, supporting efficient restaurant or food service operations.</td>
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
											<td style='padding: 8px;'>- The <code>page.tsx</code> file within the Settings feature of the frontend application serves as the central hub for user configuration and administrative options<br>- It provides a user interface that allows authenticated users to navigate to various settings pages, such as user management, notifications, inventory, and backup/restore functionalities<br>- By organizing these options into a cohesive layout, this component facilitates streamlined access to key administrative features, supporting the overall architectures goal of modular, role-based management within the application.</td>
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
													<td style='padding: 8px;'>- Notification Settings PageThis code defines the <strong>Notification Settings</strong> page within the frontend application, serving as the user interface for managing notification preferences<br>- It integrates with backend services to fetch and update user-specific notification configurations, providing a seamless and interactive experience<br>- The page includes mechanisms for handling unsaved changes, saving preferences, and navigating away safely, ensuring users can customize their notification settings confidently<br>- Overall, it plays a crucial role in the user profile management segment of the application, enabling personalized communication preferences within the broader system architecture.</td>
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
															<td style='padding: 8px;'>- Provides a hook to manage user notification preferences by fetching, updating, and maintaining notification settings from the backend<br>- Facilitates seamless synchronization of notification configurations, enabling dynamic updates and error handling within the applications settings interface<br>- Integrates with backend APIs to ensure users notification preferences are current and accurately reflected in the user experience.</td>
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
													<td style='padding: 8px;'>- Inventory Settings PageThis code defines the Inventory Settings page within the applications frontend, serving as a centralized interface for managing inventory categories and their configurations<br>- It enables users to view, add, modify, and delete inventory categories such as Meats, Vegetables & Fruits, Dairy & Eggs, and others<br>- The page interacts with backend APIs to fetch existing settings and perform CRUD operations, ensuring that inventory configurations are kept current and aligned with user inputs<br>- Overall, it provides a user-friendly, responsive interface for maintaining inventory-related data within the broader application architecture.</td>
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
															<td style='padding: 8px;'>- Provides a custom React hook for managing inventory settings via API interactions, enabling fetching, creating, updating, and deleting inventory configuration data<br>- Facilitates seamless integration of inventory management features within the frontend, supporting dynamic updates and error handling to ensure a robust user experience aligned with the overall application architecture.</td>
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
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement</code> directory serves as the main interface for managing user accounts within the application<br>- It provides a comprehensive view of user data, including IDs, names, usernames, emails, roles, and statuses, and facilitates user management actions such as editing, deleting, and password changes<br>- This component integrates navigation and responsive design elements to ensure a seamless user experience across devices<br>- Overall, it acts as the central hub for administrators to oversee and modify user information, supporting the broader architectures goal of secure and efficient user management within the applications settings module.</td>
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
															<td style='padding: 8px;'>- AddUsers ComponentThis component provides the user interface for adding new users within the applications settings section<br>- It enables administrators to input user details, assign roles, and manage password visibility, facilitating streamlined user onboarding<br>- The component integrates with the overall application architecture by handling navigation, state management, and interactions with the backend (via Supabase) to create new user records<br>- It plays a crucial role in the user management workflow, ensuring that user addition is intuitive, secure, and aligned with the application's role-based access controls.</td>
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
															<td style='padding: 8px;'>- This code file defines the EditUser component within the user management feature of the frontend application<br>- Its primary purpose is to facilitate the viewing and editing of user details, including roles, status, and password, within the broader user management system<br>- By integrating with the application's navigation and API hooks, it enables seamless user data retrieval, updates, and password changes, supporting administrative workflows for managing user accounts effectively<br>- This component plays a crucial role in the user management architecture by providing a dedicated interface for user modifications, ensuring data consistency and a smooth user experience across the platform.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/Update_Users/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during user management updates within the settings feature<br>- It ensures users receive immediate feedback while data is loading, maintaining a smooth and responsive experience<br>- This component integrates seamlessly into the broader frontend architecture, supporting efficient user management workflows by signaling ongoing processes during asynchronous operations.</td>
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
															<td style='padding: 8px;'>- Provides a set of React hooks for managing user data within the application, enabling functionalities such as listing, retrieving, creating, updating, deleting, and password management of users<br>- Integrates with backend APIs to facilitate seamless user administration, supporting role-based operations and ensuring secure password updates, thereby centralizing user management logic within the frontend architecture.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement/View_Users</code> directory serves as the main interface for viewing detailed user information within the applications user management feature<br>- It functions as a dedicated page that retrieves and displays individual user data, integrating navigation and responsive design elements to enhance user experience<br>- This component plays a crucial role in the overall architecture by enabling administrators or authorized users to access, review, and manage user profiles seamlessly, thereby supporting the applications broader goal of efficient user management and settings configuration.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/View_Users/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the user management interfaces loading state within the settings feature<br>- It ensures a seamless user experience by maintaining layout consistency during data fetches or transitions, supporting the overall architectures focus on modular, responsive, and user-centric design in the frontend application.</td>
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
													<td style='padding: 8px;'>- This code file implements the user interface and core interactions for the backup and restore functionality within the applications settings section<br>- It facilitates users in managing data backups by providing options to schedule automatic backups, manually trigger backups to local storage or Google Drive, and restore data from these sources<br>- The component integrates with external services like Google Drive for cloud storage, ensuring seamless backup management<br>- Overall, it serves as the central interface for data preservation and recovery, contributing to the applications data integrity and user control within the broader architecture.</td>
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
															<td style='padding: 8px;'>- Provides core functionalities for backing up and restoring application data, including local file download, encryption, decryption, and decompression, as well as integration with cloud storage services like Google Drive<br>- Facilitates secure data management within the applications settings, ensuring users can safeguard and recover their data efficiently across different storage mediums.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/backup_restore/hook/useBackupSchedule.ts'>useBackupSchedule.ts</a></b></td>
															<td style='padding: 8px;'>- Provides mechanisms to retrieve and update backup scheduling configurations within the application<br>- Facilitates seamless management of backup frequency and timing, integrating with backend APIs to ensure data consistency<br>- Supports the overall data protection architecture by enabling dynamic scheduling adjustments, contributing to reliable and user-configurable backup processes across the platform.</td>
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
											<td style='padding: 8px;'>- SupplierPage ComponentThis file defines the <code>SupplierPage</code> component, which serves as the main interface for managing supplier data within the application<br>- It provides users with the ability to view, search, edit, and delete supplier records, integrating seamlessly into the overall architecture by leveraging React hooks, context, and API interactions<br>- The component ensures a responsive and user-friendly experience for supplier management, supporting role-based access control and real-time data updates through React Query<br>- It acts as a central hub for supplier-related operations, contributing to the applications modular and scalable design.</td>
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
													<td style='padding: 8px;'>- Provides a detailed view of supplier information within the application, enabling users to access, review, and update supplier details seamlessly<br>- Integrates data fetching, formatting, and presentation layers to ensure a comprehensive and user-friendly display of supplier data, supporting efficient supplier management within the overall system architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/View_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a placeholder component for the supplier view loading state within the frontend application<br>- It ensures a seamless user experience by maintaining layout consistency during data fetches or asynchronous operations, supporting smooth navigation and interaction flow in the supplier management feature of the overall system architecture.</td>
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
													<td style='padding: 8px;'>- Provides a set of React hooks for managing supplier data through API interactions, enabling seamless retrieval, creation, updating, deletion, and listing of suppliers within the application<br>- Facilitates efficient integration of supplier management functionalities into the frontend, supporting dynamic data handling and maintaining synchronization with backend services in the overall architecture.</td>
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
													<td style='padding: 8px;'>- This code file defines the EditSupplier component within the frontend application's supplier management feature<br>- Its primary purpose is to facilitate the editing of supplier details by fetching existing supplier data, presenting it in an interactive form, and handling updates<br>- It integrates with the application's navigation and API layers to ensure seamless user experience and data consistency<br>- Overall, this component plays a crucial role in enabling users to modify supplier information efficiently within the broader supplier management architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/Update_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during the supplier update process within the frontend application<br>- It ensures users are informed of ongoing loading states, enhancing user experience and interface responsiveness during asynchronous operations in the supplier management workflow<br>- This component integrates seamlessly into the supplier feature, supporting smooth and clear user interactions.</td>
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
													<td style='padding: 8px;'>- AddSupplier PageThis component provides the user interface for adding a new supplier within the application<br>- It facilitates capturing supplier details through a form, managing user input, and handling form submission<br>- As part of the larger codebase, it integrates with the supplier management architecture to enable users to expand their supplier database efficiently<br>- The page ensures a seamless user experience by incorporating validation, navigation, and responsive design elements, contributing to the overall functionality of the supplier management module.</td>
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
											<td style='padding: 8px;'>- Provides an intuitive inventory management interface within a restaurant application, enabling users to access comprehensive views of master, daily, and surplus inventories<br>- Facilitates seamless navigation through visually engaging, responsive cards that highlight key inventory categories, supporting real-time tracking and operational decision-making across storage locations<br>- Integrates branding and user experience elements to enhance usability and engagement.</td>
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
													<td style='padding: 8px;'>- The <code>page.tsx</code> file for the Inventory Master page serves as the central interface for viewing, managing, and interacting with inventory data within the application<br>- It provides users with a comprehensive overview of inventory items, including details such as stock levels, categories, and statuses, while enabling actions like editing, deleting, filtering, and sorting inventory records<br>- This component integrates various hooks and APIs to fetch real-time data, manage state, and facilitate user interactions, ensuring a dynamic and responsive user experience<br>- Overall, it acts as the primary dashboard for inventory management, supporting efficient oversight and operational decision-making within the broader system architecture.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>Add_Inventory</code> feature serves as the main interface for adding new inventory items within the applications inventory management system<br>- It provides users with a form-driven UI to input detailed information about inventory products, such as categories, quantities, and other relevant attributes<br>- This component integrates with backend APIs to fetch necessary settings and save new inventory data, ensuring seamless synchronization with the overall inventory data store<br>- Overall, it facilitates efficient inventory entry, supporting the broader architectures goal of maintaining accurate, up-to-date stock information across the system.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file serves as the main interface for viewing detailed information about a specific inventory item within the applications inventory management module<br>- It integrates user authentication, navigation, and API interactions to fetch and display comprehensive data about an inventory item, facilitating user interactions such as viewing, editing, or navigating back to the inventory list<br>- This component plays a crucial role in the frontend architecture by providing a user-centric view layer that connects backend inventory data with the overall application navigation and user context, ensuring a seamless and informative user experience in the inventory management workflow.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/View_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the inventory views loading state within the Master Inventory feature<br>- It ensures a seamless user experience during data fetches or processing by maintaining layout consistency without displaying any visual content<br>- This contributes to the overall architecture by supporting smooth transitions and efficient rendering in the inventory management interface.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file within the Inventory feature serves as the main interface for editing inventory items in the application<br>- It provides a user-friendly form-driven view that allows users to modify existing inventory data, such as categories, quantities, and other item details<br>- This component integrates with the broader inventory management system by fetching specific item data based on URL parameters and updating the backend through API calls<br>- Overall, it plays a crucial role in enabling seamless inventory updates, ensuring data consistency, and supporting efficient inventory management workflows within the applications architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/Update_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during inventory update processes within the Master Inventory feature, ensuring users are informed of ongoing loading states<br>- Integrates seamlessly into the inventory management workflow, enhancing user experience by signaling when data is being fetched or processed, thereby maintaining clarity and responsiveness in the applications interface.</td>
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
													<td style='padding: 8px;'>- Provides a comprehensive hook for managing inventory data across multiple categories, including current stock, daily inventory, and surplus items<br>- Facilitates CRUD operations and transfers between categories, supporting seamless synchronization with backend APIs<br>- Integrates inventory workflows into the frontend architecture, enabling efficient inventory tracking, updates, and state management within the overall application ecosystem.</td>
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
													<td style='padding: 8px;'>- This code file defines the Today Inventory page within the inventory management feature of the application<br>- Its primary purpose is to display and manage the current day's inventory data, providing users with an interactive interface to view, filter, sort, and perform actions on inventory items<br>- It integrates various UI components and hooks to facilitate real-time data fetching, state management, and user interactions, thereby enabling efficient oversight and updates of inventory status in the context of the overall inventory system architecture.</td>
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
															<td style='padding: 8px;'>- Page.tsx`-Edit Today’s Inventory ItemThis component serves as the primary interface for viewing and updating inventory data for the current day within the applications inventory management system<br>- It enables users to seamlessly edit inventory items, reflecting real-time changes in the overall inventory tracking architecture<br>- By integrating with the inventory API, it ensures that modifications are accurately captured and synchronized with the backend, supporting the system's goal of maintaining up-to-date inventory records<br>- This page functions as a critical touchpoint for inventory adjustments, contributing to the broader architecture's focus on real-time data accuracy and user-driven inventory management.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/Update_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during data loading processes within the Inventory management feature<br>- It ensures users receive immediate feedback while inventory data for the current day is being fetched or updated, enhancing user experience by signaling ongoing background operations in the context of the overall frontend architecture.</td>
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
															<td style='padding: 8px;'>- Page.tsx<code> in </code>View_Today_Inventory`This component serves as the main interface for viewing todays inventory within the application<br>- It orchestrates the display of inventory data specific to the current day, integrating user authentication, navigation, and responsive layout features<br>- By leveraging custom hooks and context, it ensures that users with appropriate roles can access real-time inventory insights, facilitating efficient inventory management and decision-making<br>- Overall, this file acts as the central hub for presenting and interacting with today's inventory data in the broader application architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/View_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>Provides a placeholder component for the Today Inventory view during data loading states, ensuring a seamless user experience by maintaining layout consistency while inventory data is fetched and rendered within the overall inventory management architecture.</td>
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
													<td style='padding: 8px;'>- Surplus Inventory PageThis file defines the Surplus Inventory page within the Inventory feature of the application<br>- Its primary purpose is to provide users with an interactive interface for viewing, managing, and analyzing surplus inventory data<br>- The page integrates various UI components, icons, and hooks to facilitate functionalities such as searching, filtering, sorting, and performing actions (e.g., editing or deleting surplus inventory items)<br>- It also connects to backend APIs to fetch and update inventory data, ensuring real-time synchronization and a seamless user experience<br>- Overall, this component serves as a centralized hub for managing surplus inventory, supporting operational decision-making within the broader inventory management architecture.</td>
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
															<td style='padding: 8px;'>- Provides a detailed view of individual surplus inventory items, enabling users to access comprehensive information such as item details, stock status, and timestamps<br>- Integrates data fetching, formatting, and user navigation, supporting inventory management workflows within the broader application architecture focused on surplus stock oversight and decision-making.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the surplus inventory view, ensuring a seamless user experience during data loading states within the inventory management feature<br>- It integrates into the overall frontend architecture by maintaining UI consistency while inventory data is fetched or processed, supporting smooth navigation and interaction in the surplus inventory module.</td>
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
											<td style='padding: 8px;'>- Dashboard PageThis file defines the main dashboard interface within the frontend application, serving as the central hub for visualizing key business metrics<br>- It integrates various data sources and visual components to provide users with real-time insights into sales performance, inventory status, and operational alerts<br>- The dashboard enables users to monitor sales trends, identify low-stock ingredients, and track expiring items, facilitating informed decision-making and proactive management<br>- Overall, it acts as the primary user interface for high-level analytics and operational oversight within the applications architecture.</td>
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
													<td style='padding: 8px;'>- Provides a custom React hook to fetch and manage multi-timeframe sales prediction data, including daily, weekly, and monthly forecasts<br>- Facilitates seamless integration of predictive sales insights into the dashboard, enabling dynamic visualization and analysis of top sales trends across different periods within the applications architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/use-dashboardAPI.ts'>use-dashboardAPI.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a set of hooks to interact with the dashboard API, enabling retrieval of key inventory insights such as low stock, expiring, and surplus ingredients<br>- Facilitates seamless data fetching for the dashboard component, supporting real-time inventory management and decision-making within the applications architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/useSalesPrediction.ts'>useSalesPrediction.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a React hook for fetching and managing weekly or top sales prediction data from an API, enabling dynamic updates and error handling within the dashboard<br>- It integrates seamlessly into the applications architecture to support data-driven insights and visualizations related to sales forecasting.</td>
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
									<td style='padding: 8px;'>- Defines centralized route mappings for the applications navigation structure, enabling consistent URL referencing across the frontend<br>- Facilitates seamless routing to core features such as inventory management, reports, user settings, and other modules, supporting maintainability and scalability within the overall architecture.</td>
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
									<td style='padding: 8px;'>- Facilitates centralized control of loading state within the frontend application by allowing registration of a loading setter function and providing a mechanism to trigger loading state updates<br>- This setup enables consistent visual feedback during asynchronous operations, ensuring seamless user experience across different components and modules in the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/index.ts'>index.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates consistent class name management across the frontend application by re-exporting a utility function from the utils module<br>- Integrates seamlessly into the project’s architecture, promoting cleaner component styling and easier maintenance within the app’s UI layer<br>- Enhances the overall codebase by centralizing class name handling, supporting scalable and organized frontend development.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/utils.ts'>utils.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a utility function to concatenate multiple CSS class names dynamically, ensuring only valid, non-falsy values are included<br>- It streamlines styling logic across the frontend application, promoting consistent and maintainable class management within the overall architecture<br>- This enhances the flexibility and readability of UI component styling throughout the project.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/axios.ts'>axios.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized Axios instance configured for robust API communication within the frontend architecture<br>- It manages request retries, handles authentication tokens, and standardizes error and success notifications, ensuring seamless user experience and consistent error handling across the application<br>- This setup enhances reliability and user feedback during server interactions in the overall codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/loadingHandler.ts'>loadingHandler.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized mechanism to manage loading states across the frontend application, enabling consistent visual feedback during asynchronous operations<br>- Integrates with the global loading setter to initiate or terminate loading indicators, thereby enhancing user experience and maintaining state coherence within the overall architecture.</td>
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
									<td style='padding: 8px;'>- Provides a comprehensive React hook for managing Progressive Web App (PWA) data, enabling seamless caching, offline support, and automatic synchronization<br>- It handles data fetching, caching strategies, offline queue management, and cache invalidation, ensuring reliable data access and updates across online and offline states<br>- Facilitates efficient, resilient data handling within the overall PWA architecture.</td>
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
									<td style='padding: 8px;'>- Facilitates user password recovery by providing a user interface for submitting email addresses to trigger password reset emails through Supabase authentication<br>- Integrates seamlessly into the authentication flow, guiding users to reset their passwords and ensuring smooth navigation back to login, thereby enhancing account security and user experience within the overall application architecture.</td>
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
									<td style='padding: 8px;'>- Provides user authentication management within the application by maintaining session state, handling login status, and role-based access control<br>- Integrates with Supabase for session validation and synchronizes user data with backend APIs<br>- Ensures seamless user experience through real-time auth state updates and session refreshes, forming a core component of the app’s security and user management architecture.</td>
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
									<td style='padding: 8px;'>- Provides core utilities for Progressive Web App (PWA) functionality within Cardiac Delights, enabling seamless installation, offline support, network status monitoring, background synchronization, and push notifications<br>- These utilities facilitate enhanced user engagement and reliability by managing PWA lifecycle events, offline actions, and real-time communication, integrating smoothly into the overall application architecture to deliver a resilient, app-like experience.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/_app.tsx'>_app.tsx</a></b></td>
									<td style='padding: 8px;'>- Establishes the global application structure by integrating authentication context across all pages<br>- Facilitates user state management and access control throughout the frontend, ensuring consistent authentication handling<br>- Serves as the foundational entry point for initializing app-wide providers, enabling seamless user experience and secure interactions within the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/pwaCache.ts'>pwaCache.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a utility for managing Progressive Web App (PWA) caching strategies, enabling efficient storage and retrieval of various data types in local storage<br>- It ensures data freshness through configurable time-to-live settings, supports cache invalidation, and maintains cache metadata, thereby optimizing performance and offline capabilities within the overall application architecture.</td>
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
											<td style='padding: 8px;'>- Facilitates user authentication workflows by providing functions to handle login and logout processes within the frontend application<br>- Integrates with backend API endpoints to authenticate users, manage access tokens, and maintain session state, thereby supporting secure user access management across the overall application architecture.</td>
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
											<td style='padding: 8px;'>- Establishes a centralized Supabase client for seamless backend communication within the frontend application<br>- Facilitates secure and efficient interactions with the database and authentication services, supporting core functionalities such as user management and data retrieval<br>- Integrates environment variables for flexible configuration, ensuring consistency across different deployment environments within the overall project architecture.</td>
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
					<td style='padding: 8px;'>- Defines project dependencies and package versions essential for backend environment setup, ensuring consistent and reliable operation across development and deployment<br>- Serves as the foundation for integrating various libraries and tools that support core functionalities, security, and performance within the overall architecture<br>- Facilitates smooth onboarding and maintenance by specifying precise requirements for the backend ecosystem.</td>
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
							<td style='padding: 8px;'>- Facilitates secure OAuth 2.0 authentication with Google services, enabling user login and authorization within the application<br>- Integrates Googles identity platform into the overall architecture, supporting seamless user access and interaction with Google APIs, which is essential for features requiring user-specific data or permissions.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/main.py'>main.py</a></b></td>
							<td style='padding: 8px;'>- Defines the core FastAPI application, orchestrating API routes for inventory management, sales analytics, user authentication, notifications, and backups<br>- Integrates background scheduling for inventory alerts and configures middleware for CORS<br>- Serves as the central hub connecting various functional modules, ensuring seamless communication and operational stability within the overall system architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/supabase.py'>supabase.py</a></b></td>
							<td style='padding: 8px;'>- Establishes core backend integrations by configuring clients for Supabase and PostgreSQL, enabling seamless data access and management across the application<br>- Facilitates secure, asynchronous database interactions and external service communication, serving as a foundational component that supports data operations and backend connectivity within the overall architecture.</td>
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
									<td style='padding: 8px;'>- Provides comprehensive user management functionalities within the backend architecture, including retrieving, creating, updating, deleting, and resetting passwords for users<br>- Integrates with Supabase for data storage and authentication, while maintaining activity logs for audit purposes<br>- Ensures role-based access control and synchronizes user data across systems, supporting secure and organized user lifecycle operations.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/rolebasedAccess.py'>rolebasedAccess.py</a></b></td>
									<td style='padding: 8px;'>- Defines role-based access control (RBAC) routes for managing inventory, menu, suppliers, reports, settings, and user sessions within the backend API<br>- Ensures that users with appropriate roles can perform specific actions, maintaining security and proper authorization across various system functionalities in the application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/userActivity.py'>userActivity.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing user activity logs within the backend architecture<br>- Facilitates creation and retrieval of user actions, supporting activity tracking and auditing<br>- Integrates with the database to store detailed activity records and provides mechanisms for filtering by user, ensuring comprehensive insights into user interactions across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/menu.py'>menu.py</a></b></td>
									<td style='padding: 8px;'>- This code file defines API routes for managing menu items within the applications backend architecture<br>- Its primary purpose is to facilitate the creation of new menu entries, including uploading associated images and specifying ingredients, all through a single, streamlined request<br>- By integrating role-based access control, it ensures that only authorized users such as Owners, General Managers, or Store Managers can perform these operations<br>- Overall, this module plays a crucial role in enabling dynamic menu management, supporting the broader systems goal of flexible and secure content updates in the restaurant or retail environment.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/auth_routes.py'>auth_routes.py</a></b></td>
									<td style='padding: 8px;'>- Defines authentication endpoints for user login, session validation, and logout, integrating Supabase for user data management and activity logging<br>- Facilitates secure token validation, updates user records with authentication IDs, and tracks user activity, ensuring seamless and secure user authentication workflows within the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/automaticbackup.py'>automaticbackup.py</a></b></td>
									<td style='padding: 8px;'>- Implements automated backup scheduling for the application, enabling users to configure periodic database backups<br>- Supports daily, weekly, and monthly schedules, executing local database dumps and uploading backups to Google Drive<br>- Integrates with FastAPI endpoints for schedule management and ensures backups are dynamically rescheduled based on user preferences, maintaining data integrity and availability within the overall system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory.py'>inventory.py</a></b></td>
									<td style='padding: 8px;'>- The <code>inventory.py</code> file serves as the core API layer for managing inventory data within the application<br>- It provides endpoints to retrieve, update, and monitor stock levels, ensuring real-time visibility into inventory status<br>- By integrating threshold-based logic, it categorizes stock levels into statuses like Out Of Stock or Low, facilitating proactive inventory management<br>- This module plays a pivotal role in maintaining accurate stock information, supporting operational decision-making, and ensuring the overall health of the inventory management system within the broader application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_settings.py'>inventory_settings.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing inventory settings, enabling retrieval, creation, updating, and deletion within the applications architecture<br>- Integrates with the database and enforces role-based access control, while also logging user activities to ensure accountability and traceability of inventory configuration changes across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/supplier.py'>supplier.py</a></b></td>
									<td style='padding: 8px;'>- Manages supplier data within the backend architecture by providing endpoints for listing, retrieving, creating, updating, and deleting supplier records<br>- Integrates role-based access control and activity logging to ensure secure and auditable modifications, supporting seamless supplier management aligned with overall system operations.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_log.py'>inventory_log.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates recording and retrieving inventory log entries within the applications backend<br>- Supports bulk insertion of stock updates, capturing details such as item ID, stock levels, action date, user, status, and wastage<br>- Enables querying logs filtered by date ranges, ensuring accurate tracking of inventory changes over time, integral to inventory management and audit processes.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/notification.py'>notification.py</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive notification management within the system, enabling retrieval, creation, and updating of user-specific notification settings and messages<br>- Facilitates automated alerts for inventory low stock and expiring items, ensuring users stay informed about critical stock conditions<br>- Supports manual triggers for inventory checks and test notifications, integrating seamlessly with user activity logging and role-based access control.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/dashboard.py'>dashboard.py</a></b></td>
									<td style='padding: 8px;'>- Provides API endpoints for dashboard insights, including low stock inventory, expiring ingredients within a configurable timeframe, and surplus ingredients<br>- Facilitates real-time monitoring of inventory status and expiration alerts, supporting inventory management and decision-making within the broader application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_report.py'>sales_report.py</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive API endpoints for generating detailed sales analytics, including summaries, item breakdowns, temporal trends, top performers, hourly data, and period comparisons<br>- Facilitates data-driven decision-making by aggregating and analyzing sales data from the database, supporting various reporting needs within the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/backup_restore.py'>backup_restore.py</a></b></td>
									<td style='padding: 8px;'>- This code file serves as the core component for managing data backup and restoration within the applications architecture<br>- It facilitates secure, automated backups of critical database tables by integrating with Google Drive, enabling reliable storage and retrieval of data snapshots<br>- Additionally, it orchestrates the restoration process to ensure data integrity and consistency, supporting operational continuity<br>- Overall, this module plays a pivotal role in safeguarding data, enabling disaster recovery, and maintaining the robustness of the systems data management workflows.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_prediction.py'>sales_prediction.py</a></b></td>
									<td style='padding: 8px;'>- Provides an API endpoint for predicting top-selling items future sales based on historical data<br>- Utilizes sales aggregation, time series forecasting with Prophet, and dynamic visualization data, enabling informed inventory planning and demand forecasting within the broader sales analytics architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/resetpass.py'>resetpass.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates password reset requests by generating and sending reset links via email<br>- Integrates with SMTP to dispatch reset instructions, enabling users to securely initiate password recovery<br>- Serves as a critical component within the authentication flow, ensuring seamless and secure user account management across the application.</td>
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
									<td style='padding: 8px;'>- Defines the foundational ORM model class for the applications database layer, establishing a common base for all database models within the backend architecture<br>- Facilitates consistent model definitions and interactions with the database, ensuring seamless integration and maintainability across the entire codebase<br>- Serves as the core reference point for SQLAlchemy ORM mappings throughout the project.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/models/userModal.py'>userModal.py</a></b></td>
									<td style='padding: 8px;'>- Defines the User data model within the backend architecture, representing user entities stored in the database<br>- It facilitates user data management by specifying key attributes such as user ID, authentication ID, name, email, and role, enabling seamless integration and interaction with other components of the application’s data layer.</td>
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
									<td style='padding: 8px;'>- Facilitates user authentication by interfacing with Supabases authentication API, enabling secure login functionality within the backend service<br>- It manages credential verification and token retrieval, serving as a critical component for user access control and session management in the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/user_activity_log_service.py'>user_activity_log_service.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates logging and retrieval of user activity data within the application, supporting audit trails and user behavior analysis<br>- Integrates with the database to record user actions, filter logs based on various criteria, and ensure accurate activity tracking aligned with the overall system architecture<br>- Enhances transparency and accountability across user interactions.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/example_service.py'>example_service.py</a></b></td>
									<td style='padding: 8px;'>- Provides an asynchronous service function to retrieve example data within the backend architecture<br>- It facilitates data fetching operations, supporting the overall API functionality by delivering a simple message response<br>- This component plays a role in the service layer, enabling seamless data access and integration for client requests in the FastAPI application.</td>
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
									<td style='padding: 8px;'>- Implements role-based access control (RBAC) by authenticating users via JWT tokens and verifying their permissions against stored user roles in the database<br>- Facilitates secure, role-specific access to API endpoints within the backend architecture, ensuring only authorized users can perform certain actions based on their assigned roles.</td>
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
   <a href="https://github.com{/AcsOfficial/Capstone-Project/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=AcsOfficial/Capstone-Project">
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
