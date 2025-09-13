<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="left">

# CAPSTONE-PROJECT

<em>Transform Ideas Into Impactful Solutions Instantly</em>

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



---

## 📌 Features

|      | Component       | Details                                                                                     |
| :--- | :-------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**  | <ul><li>Modular monorepo structure with separate frontend and backend directories</li><li>REST API and client-server separation</li><li>Uses Next.js for frontend, Python backend with Flask or FastAPI</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>TypeScript used extensively for frontend logic</li><li>Python code adheres to PEP8 standards</li><li>ESLint and TSLint configurations enforce code consistency</li></ul> |
| 📄 | **Documentation** | <ul><li>Comprehensive README with setup instructions</li><li>API documentation generated via Swagger/OpenAPI</li><li>Inline code comments and JSDoc/TypeScript types</li></ul> |
| 🔌 | **Integrations**  | <ul><li>Supabase JS SDK for backend data management</li><li>Axios for HTTP requests</li><li>Chart.js for data visualization</li><li>Tailwind CSS for styling</li><li>OAuth via @react-oauth/google</li></ul> |
| 🧩 | **Modularity**    | <ul><li>Component-based React frontend with reusable components</li><li>Python modules for different backend functionalities</li><li>Environment variables managed via credentials.json and dotenv</li></ul> |
| 🧪 | **Testing**       | <ul><li>Frontend tests with Jest and React Testing Library</li><li>Backend tests with pytest</li><li>CI pipelines include test runs via npm and pip</li></ul> |
| ⚡️  | **Performance**   | <ul><li>Code splitting and lazy loading in Next.js</li><li>Client-side caching with SWR and React Query</li><li>Optimized images and assets</li></ul> |
| 🛡️ | **Security**      | <ul><li>OAuth 2.0 authentication with Google</li><li>Secure storage of credentials.json</li><li>Input validation and sanitization</li></ul> |
| 📦 | **Dependencies**  | <ul><li>Frontend: React, Next.js, Tailwind CSS, Chart.js, Axios</li><li>Backend: Python with Flask/FastAPI, SQL dependencies</li><li>Package managers: npm, pip</li></ul> |

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
					<td style='padding: 8px;'>- Defines project dependencies and development tools, ensuring proper integration of cryptographic functions, animation capabilities, and type support<br>- Serves as the foundation for managing external libraries essential to the applications security, user interface, and overall functionality, facilitating a cohesive and maintainable architecture across the codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- The main purpose of this code file, <code>README.md</code>, is to serve as the comprehensive documentation and project overview for the <strong>CAPSTONE-PROJECT</strong><br>- It provides an at-a-glance summary of the projects goals—transforming innovative ideas into impactful solutions—and highlights the core tools and technologies used throughout the codebase<br>- This README establishes the projects context within its architecture, offering essential information for developers, contributors, and stakeholders to understand its scope, structure, and technological foundation.</td>
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
					<td style='padding: 8px;'>- Provides a comprehensive guide for integrating Progressive Web App (PWA) features into various pages, enabling offline support, smart caching, and real-time sync status indicators<br>- Facilitates seamless data fetching, offline data display, and user notifications, ensuring enhanced user experience through reliable offline capabilities and efficient data management across the application’s architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tailwind.config.js'>tailwind.config.js</a></b></td>
					<td style='padding: 8px;'>- Defines custom Tailwind CSS configuration to enhance responsive design across diverse devices and orientations<br>- Establishes tailored breakpoints, spacing, font sizes, and sizing constraints, enabling consistent, adaptable UI styling throughout the project<br>- Facilitates a flexible, device-aware frontend architecture optimized for various screen sizes and orientations.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/eslint.config.mjs'>eslint.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Defines ESLint configuration tailored for the frontend, ensuring code quality and consistency across the project<br>- It extends recommended Next.js and TypeScript rules while customizing specific linting behaviors to accommodate development preferences<br>- This setup supports maintaining a clean, reliable codebase aligned with best practices within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/RESPONSIVE_ARCHITECTURE.md'>RESPONSIVE_ARCHITECTURE.md</a></b></td>
					<td style='padding: 8px;'>- Defines the applications responsive layout architecture, enabling seamless adaptation across mobile, tablet, and desktop devices<br>- Manages device detection, layout adjustments, and component behaviors to ensure optimal user experience, accessibility, and performance<br>- Facilitates consistent responsive patterns for navigation, modals, grids, and content presentation, supporting a cohesive and flexible multi-device interface within the overall codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the frontend applications configuration, dependencies, and scripts to facilitate development, building, and deployment within the overall system architecture<br>- It ensures seamless integration of UI components, third-party libraries, and development tools, supporting a responsive and interactive user interface that interacts with backend services and data sources.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/postcss.config.mjs'>postcss.config.mjs</a></b></td>
					<td style='padding: 8px;'>- Configure PostCSS to integrate Tailwind CSS styles into the frontend build process, enabling utility-first styling across the application<br>- This setup ensures consistent, efficient styling workflows within the overall architecture, facilitating rapid UI development and maintaining design coherence throughout the project.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/next.config.ts'>next.config.ts</a></b></td>
					<td style='padding: 8px;'>Configure Next.js to route API requests to the backend server and specify remote image sources, enabling seamless integration between frontend and backend services while supporting secure image loading from external domains within the overall application architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/tsconfig.json'>tsconfig.json</a></b></td>
					<td style='padding: 8px;'>- Defines TypeScript compiler options for the frontend project, ensuring consistent, strict, and optimized code compilation aligned with modern JavaScript standards<br>- Facilitates seamless development and integration within the Next.js framework by specifying module resolution, library support, and build behaviors, thereby supporting the overall architectures stability and maintainability.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides the foundational structure and setup instructions for a Next.js-based web application, enabling developers to run, develop, and deploy the frontend interface efficiently<br>- It guides users through local development, highlights font optimization, and offers resources for further learning, ensuring seamless integration within the overall project architecture.</td>
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
							<td style='padding: 8px;'>- Establishes the core application shell by integrating global providers for state management, authentication, and data fetching<br>- Manages Progressive Web App (PWA) behaviors, including custom install prompts and banner suppression, while ensuring service worker registration for offline capabilities<br>- Facilitates consistent user experience and app stability across the entire frontend architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/layout.tsx'>layout.tsx</a></b></td>
							<td style='padding: 8px;'>- Defines the root layout for the Cardiac Delights PWA, establishing global metadata, fonts, and styling<br>- It sets up the foundational structure for the applications responsive, offline-capable interface, integrating essential web app configurations and embedding the main application shell to ensure consistent layout and branding across all pages.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/page.tsx'>page.tsx</a></b></td>
							<td style='padding: 8px;'>- Facilitates user authentication by providing a login interface integrated with backend API and Supabase services<br>- Manages user credentials, handles login flow, password reset requests, and displays feedback modals<br>- Serves as the primary entry point for user access, ensuring secure session initiation and seamless navigation to the dashboard within the applications architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/loading.tsx'>loading.tsx</a></b></td>
							<td style='padding: 8px;'>- Provides a full-screen loading indicator to enhance user experience during asynchronous operations or page transitions<br>- It visually communicates ongoing processes, ensuring users remain informed and engaged while the application loads or performs background tasks within the overall frontend architecture.</td>
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
									<td style='padding: 8px;'>- Provides a global loading overlay that visually indicates ongoing background processes across the application<br>- Integrates with the app’s loading context to display a centered, animated spinner during loading states, ensuring users receive clear feedback during data fetches or operations, thereby enhancing user experience and interface responsiveness within the overall frontend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/loadingscreen.tsx'>loadingscreen.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a full-screen loading indicator featuring the applications logo and a loading message, enhancing user experience during asynchronous operations<br>- Integrates seamlessly into the overall frontend architecture by offering a visually engaging placeholder that maintains user engagement while data or components are being fetched or processed.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/ResponsiveMain.tsx'>ResponsiveMain.tsx</a></b></td>
									<td style='padding: 8px;'>- Provides a responsive layout wrapper that dynamically adjusts main content margins based on device type, screen size, and navigation state<br>- Ensures optimal content presentation across various devices by managing layout shifts and preventing overflow, while handling hydration issues during initial rendering<br>- Integrates seamlessly within the overall architecture to deliver a consistent, adaptable user interface experience.</td>
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
											<td style='padding: 8px;'>- Defines a set of reusable, styled React components for building consistent card interfaces within the applications UI<br>- These components facilitate the creation of structured, visually cohesive card layouts, including headers, titles, descriptions, content areas, and footers, supporting a modular and maintainable design system across the frontend.</td>
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
											<td style='padding: 8px;'>- SummaryThe <code>navigation.tsx</code> component serves as the primary client-side navigation interface within the frontend application<br>- It orchestrates user interactions with the applications menu, manages navigation state, and integrates user authentication and offline capabilities<br>- By providing dynamic routing, responsive UI elements, and real-time notifications, this component ensures a seamless and intuitive user experience across the entire codebase<br>- It acts as a central hub for user navigation, contextual actions, and system status updates, thereby supporting the overall architecture's goal of delivering a robust, user-centric frontend interface.</td>
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
													<td style='padding: 8px;'>- Provides comprehensive management of user navigation and device responsiveness within the application<br>- It detects device type, screen size, orientation, and accessibility preferences, enabling adaptive UI behavior<br>- Additionally, it handles menu state, online status, and PWA mode, ensuring a seamless, accessible, and responsive user experience across diverse devices and environments.</td>
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
											<td style='padding: 8px;'>- Provides user interface components to enhance Progressive Web App (PWA) functionality, including an install prompt, network connectivity indicator, and comprehensive PWA status overview<br>- These components facilitate seamless user engagement, offline access, and real-time status updates, integrating core PWA features into the overall application architecture for improved user experience and reliability.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExampleUsage.tsx'>PWAExampleUsage.tsx</a></b></td>
											<td style='padding: 8px;'>- Implements comprehensive Progressive Web App (PWA) features within an inventory management context, enabling smart caching, offline data access, real-time sync status, and optimistic updates<br>- Facilitates seamless user experience by ensuring data persistence, visibility of offline and stale states, and automatic synchronization, thereby enhancing reliability and responsiveness across the entire application architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAStatus.tsx'>PWAStatus.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides user interface components to monitor and display the status of Progressive Web App (PWA) connectivity, offline data caching, and synchronization processes<br>- Facilitates real-time feedback on online/offline states, cached data freshness, and pending actions, enhancing user awareness of data sync status and offline capabilities within the overall PWA architecture.</td>
										</tr>
										<tr style='border-bottom: 1px solid #eee;'>
											<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/components/PWA/PWAExample.tsx'>PWAExample.tsx</a></b></td>
											<td style='padding: 8px;'>- Provides a comprehensive example of integrating Progressive Web App (PWA) features into a feature page, including offline support, network status monitoring, and notification permissions<br>- Facilitates seamless user experiences by enabling offline data handling, automatic synchronization upon reconnection, and user engagement through notifications, aligning with the overall architectures focus on resilient, user-centric web applications.</td>
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
											<td style='padding: 8px;'>- The <code>page.tsx</code> file within the <code>frontend/app/Features/Report</code> directory serves as the main interface for accessing various analytical reports in the application<br>- It provides users with a centralized dashboard featuring navigational buttons to different report types, such as Sales, Inventory, and User Activity<br>- This component facilitates seamless user interaction by enabling quick navigation to detailed analytics pages, thereby supporting data-driven decision-making across the platform<br>- Overall, it acts as a user-friendly gateway to the reporting features, integrating role-based access and responsive design within the applications architecture.</td>
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
													<td style='padding: 8px;'>- Report Inventory PageThis file defines the main interface for viewing and managing inventory reports within the application<br>- It serves as the central component that orchestrates data fetching, user interactions, and visualization of inventory metrics<br>- The page enables users to search, filter, and analyze inventory data, providing insights into stock levels, wastage, and trends over time<br>- It integrates various UI elements such as charts, icons, and filters to facilitate an intuitive and comprehensive reporting experience, supporting informed decision-making across the inventory management system.</td>
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
															<td style='padding: 8px;'>- Provides an API hook for managing inventory logs within the frontend application<br>- Facilitates fetching inventory history, optionally filtered by date range, and saving new log entries<br>- Integrates seamlessly with backend endpoints to support inventory tracking, enabling real-time updates and historical data retrieval essential for inventory management workflows.</td>
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
													<td style='padding: 8px;'>- Report_Sales PageThis file serves as the main interface for the sales reporting feature within the application<br>- It orchestrates the display, filtering, and export of sales data, providing users with an interactive dashboard to analyze sales performance<br>- The page integrates Google Sheets for data import, enabling seamless data synchronization, and offers visualization tools such as charts and tables to facilitate insights<br>- Overall, it acts as the central hub for sales data exploration, supporting decision-making and reporting workflows in the broader application architecture.</td>
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
															<td style='padding: 8px;'>- Provides centralized access to comprehensive and simplified sales reporting hooks, enabling seamless integration of sales data insights within the application<br>- Facilitates retrieval of detailed sales metrics, performance summaries, and comparative analyses, supporting data-driven decision-making across the sales feature set in the frontend architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSimpleSalesReport.ts'>useSimpleSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a custom React hook for fetching and managing simplified sales report data across various timeframes<br>- It consolidates key sales metrics, top items, and daily sales trends, enabling seamless integration of sales insights into the user interface<br>- This hook supports dynamic data retrieval, error handling, and state management, facilitating real-time reporting within the applications sales analytics architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Report/Report_Sales/hooks/useSalesReport.ts'>useSalesReport.ts</a></b></td>
															<td style='padding: 8px;'>- Provides a comprehensive hook for fetching, managing, and formatting sales report data within the frontend application<br>- Facilitates retrieval of sales summaries, itemized sales, time-based data, top performers, hourly trends, and period comparisons, enabling dynamic and responsive sales analytics<br>- Integrates error handling and utility functions to streamline data presentation aligned with the overall reporting architecture.</td>
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
													<td style='padding: 8px;'>- Report_UserActivity PageThis file implements the user activity reporting interface within the application<br>- It provides users with a comprehensive view of user engagement and activity data, featuring functionalities such as data filtering, visualization, and export<br>- The page integrates with Google OAuth for authentication and supports exporting reports to Excel, enabling stakeholders to analyze user behavior effectively<br>- Overall, it serves as the central component for accessing, visualizing, and exporting user activity insights, aligning with the broader data-driven architecture of the platform.</td>
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
															<td style='padding: 8px;'>- Provides a React hook for managing user activity logs within the application<br>- Facilitates fetching and creating activity records via API interactions, supporting features like filtering by user, action type, and date ranges<br>- Integrates seamlessly into the reporting architecture to enable real-time tracking and analysis of user actions, enhancing auditability and user behavior insights across the platform.</td>
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
											<td style='padding: 8px;'>- Menu PageThis file defines the main user interface for managing menu items within the application<br>- It provides a comprehensive view of the menu, allowing users to browse, search, sort, and perform actions such as editing or deleting dishes<br>- The page integrates with backend APIs to fetch and manipulate menu data, ensuring real-time updates and a responsive experience<br>- It serves as a central component in the applications architecture for menu management, supporting different user roles and maintaining a consistent, interactive layout for efficient menu administration.</td>
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
													<td style='padding: 8px;'>- Provides an abstraction layer for managing menu items within the application, enabling seamless retrieval, creation, updating, and deletion of menu data, including images and ingredients<br>- Facilitates communication with backend APIs to maintain menu consistency and supports stock status recalculations, integrating menu management into the overall architecture of the frontend feature set.</td>
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
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Menu/Update_Menu</code> directory serves as the main interface for editing a specific menu item within the application<br>- It provides users with the ability to view, modify, and manage menu details, including images and ingredients<br>- This component integrates with backend APIs to fetch existing menu data, handle updates, and delete ingredients, ensuring a seamless and interactive editing experience<br>- Overall, it plays a crucial role in the menu management workflow, enabling dynamic and user-friendly updates within the broader restaurant or food service platform architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Menu/Update_Menu/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during menu update operations within the frontend application<br>- It ensures users receive immediate feedback while the system processes changes, enhancing user experience and interface responsiveness<br>- As part of the overall architecture, it supports seamless interactions during asynchronous menu modifications, contributing to a smooth and intuitive administrative workflow.</td>
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
													<td style='padding: 8px;'>- ViewMenu ComponentThis <code>ViewMenu</code> component serves as the primary interface for displaying detailed information about a specific menu within the application<br>- It integrates user authentication context, routing, and API interactions to fetch and present menu data dynamically<br>- Positioned within the frontend architecture, it functions as a dedicated page that enables users to view comprehensive menu details, supporting features like navigation and role-based access<br>- Overall, it facilitates an intuitive and responsive user experience for menu management and review within the larger application ecosystem.</td>
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
													<td style='padding: 8px;'>- Add_Menu PageThis component provides the user interface for adding a new menu item within the application<br>- It enables users to input dish details, upload images, and submit new menu entries, integrating seamlessly into the overall menu management architecture<br>- The page manages form state, handles image previews, and interacts with backend APIs to create new menu items, supporting a smooth and intuitive user experience for menu administration.</td>
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
													<td style='padding: 8px;'>- Notification Settings PageThis code defines the <strong>Notification Settings</strong> page within the frontend application, serving as the user interface for managing notification preferences<br>- It integrates with backend services to fetch and update user-specific notification configurations, providing a seamless and interactive experience<br>- The page includes features such as saving changes, handling unsaved modifications, and navigation controls, ensuring users can customize their notification preferences efficiently while safeguarding against accidental data loss<br>- Overall, it plays a crucial role in the user personalization aspect of the applications architecture, enabling tailored communication settings aligned with user needs.</td>
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
															<td style='padding: 8px;'>- Provides a hook to manage user notification preferences by fetching, updating, and maintaining notification settings state within the frontend application<br>- Facilitates seamless synchronization with backend APIs, enabling dynamic configuration of notification triggers such as low stock alerts and expiration warnings, thereby supporting personalized user notification management in the overall architecture.</td>
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
													<td style='padding: 8px;'>- Inventory Settings PageThis code defines the Inventory Settings page within the applications frontend, serving as a centralized interface for managing inventory categories and their configurations<br>- It enables users to view, create, update, and delete inventory settings, facilitating dynamic and flexible inventory management<br>- The page integrates with backend APIs to synchronize changes and provides a user-friendly interface with navigation and responsive design elements<br>- Overall, it plays a crucial role in maintaining accurate and organized inventory data, supporting the broader architecture's goal of efficient resource management.</td>
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
															<td style='padding: 8px;'>- Provides a custom React hook for managing inventory settings via API interactions, enabling fetching, creating, updating, and deleting inventory configuration data<br>- Facilitates seamless integration of inventory management functionalities within the frontend, supporting dynamic updates and error handling to maintain data consistency and user experience across the applications inventory features.</td>
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
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement</code> directory serves as the main interface for managing user accounts within the application<br>- It provides a comprehensive view of user data, including identifiers, names, roles, and statuses, and facilitates user administration tasks such as viewing, editing, deleting, and password management<br>- This component integrates navigation and responsive design elements to ensure a seamless user experience across devices<br>- Overall, it acts as the central hub for user management functionalities, supporting administrative workflows within the applications architecture.</td>
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
															<td style='padding: 8px;'>- AddUsers PageThis component provides the user interface for adding new users within the applications settings section<br>- It facilitates user creation by capturing relevant details, managing user roles, and handling form interactions<br>- The page integrates with backend services to persist new user data and ensures a smooth user experience through modals and navigation safeguards<br>- Overall, it plays a crucial role in the user management workflow, enabling administrators to efficiently onboard new users while maintaining data integrity and usability within the larger application architecture.</td>
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
															<td style='padding: 8px;'>- SummaryThe <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement/Update_Users</code> directory serves as the main interface for editing user details within the applications user management system<br>- It provides a user-friendly form that allows administrators to view, modify, and update user information such as roles and statuses<br>- This component integrates with backend APIs to fetch existing user data, submit updates, and handle password changes, ensuring seamless user management workflows<br>- Overall, it plays a critical role in maintaining accurate and up-to-date user profiles, supporting the broader architecture of secure and efficient user administration across the application.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/userManagement/Update_Users/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during user management updates within the settings feature, signaling ongoing loading processes<br>- It enhances user experience by clearly communicating system activity during asynchronous operations, ensuring users are informed while data is being fetched or processed in the context of updating user information in the application.</td>
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
															<td style='padding: 8px;'>- Provides an abstraction layer for user management operations within the frontend, enabling seamless interaction with the backend API<br>- Facilitates listing, retrieving, creating, updating, deleting, and password-changing functionalities for users, supporting administrative and user-related workflows<br>- Integrates with the overall architecture to ensure consistent user data handling across the application.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Settings/userManagement/View_Users</code> directory serves as the main interface for viewing detailed user information within the applications user management feature<br>- It functions as a dedicated page that retrieves and displays individual user data, integrating navigation and responsive design elements to ensure a seamless user experience across devices<br>- This component plays a crucial role in the overall architecture by enabling administrators or authorized users to access, review, and potentially manage user profiles, thereby supporting the applications broader user management and settings functionalities.</td>
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
													<td style='padding: 8px;'>- This code file defines the Backup & Restore page within the application's settings, serving as a central interface for managing data backup and restoration processes<br>- It facilitates user interactions for scheduling backups, initiating manual backups, restoring data from backups, and integrating with external storage providers like Google Drive<br>- Overall, it enhances data resilience and user control over data management by providing a cohesive, user-friendly interface for backup operations within the application's architecture.</td>
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
															<td style='padding: 8px;'>- Provides core functionalities for backing up and restoring application data within the frontend architecture<br>- Facilitates downloading encrypted or unencrypted backups, restoring data from local files, and integrating with cloud storage services like Google Drive<br>- Ensures secure data handling through encryption and seamless communication with backend APIs, supporting data integrity and user convenience across the applications settings management.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Settings/backup_restore/hook/useBackupSchedule.ts'>useBackupSchedule.ts</a></b></td>
															<td style='padding: 8px;'>- Provides mechanisms to retrieve and update backup scheduling configurations within the application<br>- Facilitates seamless management of backup frequency and timing, integrating with backend APIs to ensure data consistency<br>- Supports the overall architecture by enabling user-specific backup preferences, contributing to reliable data protection and restore workflows across the platform.</td>
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
											<td style='padding: 8px;'>- The <code>frontend/app/Features/Supplier/page.tsx</code> file serves as the main interface for managing supplier data within the application<br>- It provides a user-centric view that enables users to view, search, edit, and delete supplier records<br>- This component integrates with the applications authentication context to tailor functionality based on user roles and leverages API hooks to fetch and manipulate supplier information efficiently<br>- Overall, it acts as the central hub for supplier-related operations, seamlessly connecting the user interface with backend data services to support supplier management workflows within the broader application architecture.</td>
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
													<td style='padding: 8px;'>- Provides a detailed view of supplier information within the application, enabling users to access, review, and update supplier details seamlessly<br>- Integrates data fetching, formatting, and presentation components to ensure a comprehensive and user-friendly display of supplier data, supporting efficient management and navigation within the broader supply chain management architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/View_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a placeholder component for the supplier view loading state within the frontend application<br>- It integrates into the overall architecture by managing user experience during data fetches or component transitions, ensuring a seamless interface flow without displaying any visual content during loading periods<br>- This minimal implementation supports the applications responsiveness and user engagement strategies.</td>
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
													<td style='padding: 8px;'>- Provides a set of React hooks for managing supplier data through API interactions, enabling seamless retrieval, creation, updating, deletion, and listing of suppliers within the application<br>- Facilitates efficient integration of supplier management functionalities into the frontend architecture, supporting dynamic and responsive user experiences related to supplier information.</td>
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
													<td style='padding: 8px;'>- This code file defines the EditSupplier component within the frontend application's supplier management feature<br>- Its primary purpose is to facilitate the editing of supplier details by fetching existing supplier data, presenting it in an interactive form, and handling updates<br>- As part of the overall architecture, it enables seamless supplier data modification, integrating with backend APIs and ensuring a responsive user experience across devices<br>- This component plays a crucial role in maintaining accurate supplier information within the broader supply chain or vendor management system.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Supplier/Update_Supplier/loading.tsx'>loading.tsx</a></b></td>
													<td style='padding: 8px;'>- Provides a visual indicator during the supplier update process within the frontend application<br>- It ensures users receive immediate feedback while data is loading, enhancing user experience and maintaining interface responsiveness during asynchronous operations in the supplier management workflow.</td>
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
													<td style='padding: 8px;'>- AddSupplier PageThis code file implements the user interface and logic for adding a new supplier within the applications supplier management module<br>- It provides a form-driven experience that allows users to input supplier details, validate the data, and submit the information to the backend API<br>- The page integrates with the overall application architecture by utilizing shared components, routing, and API hooks, ensuring consistency and seamless navigation across the platform<br>- Its primary role is to facilitate the creation of supplier records, contributing to the broader supply chain and vendor management workflows within the system.</td>
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
											<td style='padding: 8px;'>- Provides the main interface for inventory management within the application, enabling users to navigate between master, daily, and surplus inventory views<br>- It presents a visually engaging dashboard with interactive cards that facilitate quick access to different inventory sections, supporting real-time tracking and streamlined operational oversight for restaurant stock management.</td>
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
													<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>frontend/app/Features/Inventory/Master_Inventory</code> directory serves as the main interface for managing and viewing inventory data within the application<br>- It provides a comprehensive inventory dashboard that enables users to visualize, search, filter, and perform actions on inventory items<br>- This component integrates various hooks and APIs to fetch inventory settings and data, ensuring real-time updates and interactivity<br>- Overall, it facilitates efficient inventory oversight, supporting tasks such as stock monitoring, categorization, and status management, thereby forming a critical part of the applications inventory management architecture.</td>
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
															<td style='padding: 8px;'>- The <code>page.tsx</code> file in the <code>Add_Inventory</code> feature serves as the main interface for adding new inventory items within the applications inventory management system<br>- It provides users with a form-driven UI to input detailed information about inventory products, such as categories, quantities, and other relevant attributes<br>- This component integrates with backend APIs to fetch necessary settings and submit new inventory data, ensuring seamless synchronization with the overall inventory data store<br>- Overall, it facilitates efficient inventory entry, supporting the broader architectures goal of maintaining accurate, up-to-date inventory records across the system.</td>
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
															<td style='padding: 8px;'>- Overview of <code>page.tsx</code> in Inventory ViewThis file serves as the main interface for viewing detailed information about a specific inventory item within the applications inventory management module<br>- It integrates user authentication, routing, and API interactions to fetch and display comprehensive inventory data, facilitating users' ability to review item details efficiently<br>- Positioned within the larger architecture, it functions as a client-side component that dynamically renders inventory information, supporting seamless navigation and user experience in the inventory feature set.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/View_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the inventory views loading state within the Master Inventory feature<br>- It integrates into the overall frontend architecture, ensuring a seamless user experience during data fetches or processing delays by maintaining layout consistency without displaying any visual content<br>- This supports smooth navigation and interaction flow in the inventory management interface.</td>
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
															<td style='padding: 8px;'>- This code file defines the user interface for editing inventory items within the applications inventory management feature<br>- It facilitates the retrieval, display, and updating of specific inventory data, enabling users to modify item details efficiently<br>- As part of the larger architecture, it supports seamless inventory data management by providing a dedicated, interactive page that integrates with backend APIs, ensuring data consistency and user-friendly interactions in the inventory workflow.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Master_Inventory/Update_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during inventory update processes within the Master Inventory feature<br>- It ensures users are informed of ongoing loading states, enhancing user experience by signaling that data is being processed or fetched<br>- Integrates seamlessly into the inventory management workflow, maintaining clarity and responsiveness during asynchronous operations in the frontend application.</td>
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
													<td style='padding: 8px;'>- Provides a comprehensive hook for managing inventory data across multiple categories, including current stock, todays inventory, and surplus items<br>- Facilitates CRUD operations and transfers between categories, enabling seamless synchronization with backend APIs<br>- Integrates inventory workflows into the overall architecture, supporting real-time updates and efficient inventory control within the application.</td>
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
													<td style='padding: 8px;'>- This code file defines the Today Inventory page within the inventory management feature of the application<br>- Its primary purpose is to present users with a comprehensive, interactive view of the current day's inventory status<br>- It enables users to efficiently view, filter, sort, and manage inventory items, facilitating real-time decision-making and operational oversight<br>- By integrating various hooks and UI components, the page ensures a dynamic and responsive user experience aligned with the overall architecture of the inventory system.</td>
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
															<td style='padding: 8px;'>- OverviewThis code file defines the EditTodayInventoryItem" component, a key part of the inventory management feature within the application<br>- Its primary purpose is to enable users to view and update the inventory data for the current day, facilitating real-time inventory tracking and adjustments<br>- Positioned within the Today_Inventory section of the frontend architecture, it supports the broader goal of maintaining accurate, up-to-date inventory records, which are essential for operational decision-making and inventory control<br>- The component interacts with backend APIs to fetch and persist inventory data, ensuring seamless synchronization between the user interface and the underlying data store.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/Update_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a visual indicator during data fetching or processing within the Today Inventory update feature<br>- It ensures users are informed of ongoing loading operations, enhancing user experience by maintaining clarity and responsiveness during inventory management tasks in the frontend application.</td>
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
															<td style='padding: 8px;'>- Page.tsx<code> in </code>View_Today_Inventory`This component serves as the main interface for viewing todays inventory within the application<br>- It orchestrates the retrieval and display of inventory data specific to the current day, providing users with an organized and accessible view of inventory items<br>- By integrating authentication context, navigation hooks, and inventory API calls, it ensures that users can seamlessly access up-to-date inventory information tailored to their roles and device types<br>- Overall, this file is pivotal in delivering a real-time, user-specific snapshot of inventory status, supporting efficient inventory management workflows within the broader application architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Today_Inventory/View_Today_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the Today Inventory view during loading states, ensuring a seamless user experience by maintaining layout consistency while inventory data is being fetched<br>- Integrates into the overall inventory management interface within the frontend architecture, supporting smooth transitions and improved responsiveness during data retrieval processes.</td>
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
													<td style='padding: 8px;'>- Surplus Inventory PageThis file defines the Surplus Inventory page within the Inventory feature of the application<br>- Its primary purpose is to provide a user interface for viewing, managing, and interacting with surplus inventory data<br>- It integrates various UI components, icons, and hooks to facilitate features such as searching, filtering, sorting, and performing actions (e.g., editing or deleting surplus inventory items)<br>- Overall, it serves as the central interface for users to monitor and manage surplus inventory efficiently, fitting into the broader inventory management architecture by enabling real-time data interaction and user-driven operations.</td>
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
															<td style='padding: 8px;'>- Provides a detailed view of individual surplus inventory items, enabling users to access comprehensive information such as item ID, name, category, stock status, dates, and last updates<br>- Facilitates navigation back to the inventory list and ensures seamless data fetching and presentation, supporting inventory management and decision-making within the broader supply chain architecture.</td>
														</tr>
														<tr style='border-bottom: 1px solid #eee;'>
															<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Inventory/Surplus_Inventory/View_Surplus_Inventory/loading.tsx'>loading.tsx</a></b></td>
															<td style='padding: 8px;'>- Provides a placeholder component for the surplus inventory view during loading states, ensuring a seamless user experience by maintaining layout consistency while data is being fetched<br>- Integrates into the overall inventory management interface, supporting smooth transitions and improved responsiveness within the frontend architecture.</td>
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
											<td style='padding: 8px;'>- Dashboard PageThis file defines the main dashboard interface within the frontend application, serving as the central hub for visualizing key business metrics<br>- It integrates various data sources and visual components to provide users with real-time insights into sales performance, inventory status, and operational alerts<br>- The dashboard facilitates interactive data exploration through filters and dynamic charts, supporting informed decision-making across the platforms architecture.</td>
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
													<td style='padding: 8px;'>- Provides a custom React hook to fetch and manage multi-timeframe sales prediction data, including daily, weekly, and monthly forecasts<br>- Facilitates asynchronous data retrieval, loading state management, and error handling, enabling seamless integration of predictive sales insights into the dashboard component of the application’s architecture.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/use-dashboardAPI.ts'>use-dashboardAPI.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a set of hooks for fetching key inventory insights—low stock, expiring, and surplus ingredients—within the dashboard feature<br>- These functions enable real-time data retrieval to support inventory management and decision-making, integrating seamlessly with the overall architecture to enhance user visibility into stock status and facilitate proactive inventory control.</td>
												</tr>
												<tr style='border-bottom: 1px solid #eee;'>
													<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/Features/Dashboard/hook/useSalesPrediction.ts'>useSalesPrediction.ts</a></b></td>
													<td style='padding: 8px;'>- Provides a React hook for fetching and managing sales prediction data from an API, enabling dynamic updates of sales forecasts within the dashboard<br>- Facilitates seamless integration of predictive insights into the user interface, supporting data-driven decision-making and enhancing the overall analytics capabilities of the application.</td>
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
									<td style='padding: 8px;'>- Facilitates centralized management of loading state within the frontend application by allowing registration of a loading setter function and providing a mechanism to toggle loading indicators<br>- This setup enables consistent visual feedback during asynchronous operations, ensuring seamless user experience across different components and parts of the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/index.ts'>index.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates consistent class name management across the frontend application by re-exporting a utility function from the utils module<br>- Integrates seamlessly into the project’s architecture, promoting maintainability and streamlined styling practices within the app’s component library.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/utils.ts'>utils.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a utility function to concatenate multiple class names into a single string, filtering out falsy values<br>- It streamlines dynamic styling within the frontend application, ensuring clean and efficient class management across components<br>- This enhances the maintainability and consistency of the user interface by simplifying conditional class application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/axios.ts'>axios.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized Axios instance configured for robust API communication within the frontend architecture<br>- It manages request retries, handles authentication tokens, and standardizes error and success notifications, ensuring seamless user experience and reliable server interactions across the application<br>- This setup enhances maintainability and consistency in handling API requests throughout the codebase.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/lib/loadingHandler.ts'>loadingHandler.ts</a></b></td>
									<td style='padding: 8px;'>- Facilitates global management of loading states within the frontend application, enabling seamless control over user interface feedback during asynchronous operations<br>- Integrates with the centralized loadingSetter to toggle loading indicators, thereby enhancing user experience and maintaining consistent state handling across various components in the overall architecture.</td>
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
									<td style='padding: 8px;'>- Provides comprehensive hooks for managing Progressive Web App (PWA) features, including installation, offline actions, network status, and notifications<br>- Facilitates seamless PWA integration within the application, enabling offline support, push notifications, and install prompts, thereby enhancing user engagement and resilience across varying network conditions<br>- Serves as a core utility layer for PWA capabilities within the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/hooks/usePWAData.ts'>usePWAData.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a comprehensive React hook for managing Progressive Web App (PWA) data, enabling seamless offline caching, automatic synchronization, and real-time updates<br>- It simplifies data fetching, caching, and offline handling, ensuring resilient user experiences across network conditions<br>- The hook supports optimistic updates, cache invalidation, and background sync, integrating tightly with the overall PWA architecture to enhance data reliability and performance.</td>
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
									<td style='padding: 8px;'>- Facilitates user password recovery by providing a form to request a reset link via email<br>- Integrates with Supabase authentication to trigger password reset workflows and guides users to update their password securely<br>- Enhances overall authentication flow within the application, ensuring a seamless and user-friendly experience for account recovery.</td>
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
									<td style='padding: 8px;'>- Provides user authentication management within the application by maintaining session state, handling login status, and role-based access control<br>- Integrates with Supabase for session validation and synchronizes user data with backend APIs, ensuring secure and seamless user experience across the app<br>- Acts as a central context for authentication status, enabling consistent access control throughout the codebase.</td>
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
									<td style='padding: 8px;'>- Provides core utilities for Progressive Web App (PWA) functionality within Cardiac Delights, enabling seamless installation, offline support, network status monitoring, background synchronization, and push notifications<br>- These utilities facilitate enhanced user engagement and reliability by managing PWA lifecycle events, offline actions, and real-time communication, integrating essential PWA features into the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/_app.tsx'>_app.tsx</a></b></td>
									<td style='padding: 8px;'>- Establishes the global application structure by integrating authentication context across all pages<br>- Facilitates user state management and access control throughout the frontend, ensuring consistent authentication handling<br>- Serves as the foundational entry point for initializing app-wide providers, enabling seamless user experience and secure interactions within the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/frontend/app/utils/pwaCache.ts'>pwaCache.ts</a></b></td>
									<td style='padding: 8px;'>- Provides a comprehensive utility for managing Progressive Web App (PWA) caching strategies, enabling efficient storage, retrieval, and invalidation of various data types in local storage<br>- Facilitates optimized data freshness and performance by implementing tailored cache durations, supporting the overall architectures goal of delivering a responsive, offline-capable user experience.</td>
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
											<td style='padding: 8px;'>- Facilitates user authentication workflows within the frontend application by handling login and logout processes<br>- Integrates with backend API endpoints to authenticate users, manage access tokens, and maintain session state through local storage<br>- Supports secure user session management, contributing to the overall architectures focus on seamless and protected user access across the platform.</td>
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
											<td style='padding: 8px;'>- Establishes a centralized Supabase client for seamless backend communication within the frontend application<br>- Facilitates secure and efficient interactions with the database and authentication services, supporting core functionalities such as user management, data retrieval, and real-time updates<br>- Integrates environment variables for flexible configuration, ensuring consistency across different deployment environments within the overall project architecture.</td>
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
					<td style='padding: 8px;'>- Defines project dependencies and environment configurations essential for backend operations<br>- Ensures consistent setup of libraries and tools required for API handling, authentication, data processing, and performance optimization, supporting the overall architectures stability and scalability<br>- Facilitates seamless development, testing, and deployment workflows across the backend ecosystem.</td>
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
							<td style='padding: 8px;'>- Facilitates secure OAuth 2.0 authentication with Google, enabling user login and authorization within the application<br>- Integrates Googles identity services into the overall architecture, supporting user management and access control for the platform<br>- Ensures seamless and protected interactions between users and backend services, forming a critical component of the system’s authentication framework.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/main.py'>main.py</a></b></td>
							<td style='padding: 8px;'>- Defines the core FastAPI application, orchestrating API routes for inventory management, sales analytics, user authentication, notifications, and system maintenance<br>- Integrates background scheduling for inventory alerts and configures middleware for CORS<br>- Serves as the central hub connecting various modules, ensuring seamless communication and operational stability within the overall system architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/supabase.py'>supabase.py</a></b></td>
							<td style='padding: 8px;'>- Establishes core backend integrations by configuring the Supabase client for external service interactions and setting up asynchronous access to the PostgreSQL database<br>- Facilitates seamless data operations and external API communication within the applications architecture, supporting efficient data management and third-party service integration across the codebase.</td>
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
									<td style='padding: 8px;'>- Provides RESTful API endpoints for managing user data within the application, including retrieval, creation, updating, deletion, and password resets<br>- Integrates with Supabase for database and authentication operations, while maintaining activity logs for audit purposes<br>- Ensures role-based access control and handles user lifecycle events, supporting comprehensive user management within the overall system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/rolebasedAccess.py'>rolebasedAccess.py</a></b></td>
									<td style='padding: 8px;'>- Defines role-based access control routes for managing inventory, menu, suppliers, reports, settings, and user sessions within the application<br>- Enforces permissions based on user roles, ensuring appropriate access levels across various functionalities<br>- Serves as a central authorization layer, maintaining security and role-specific operations throughout the backend architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/userActivity.py'>userActivity.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing user activity logs within the backend architecture<br>- Facilitates creation and retrieval of user actions, supporting activity tracking and auditing<br>- Integrates with the database to store detailed activity records, enabling insights into user behavior and system usage patterns across the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/menu.py'>menu.py</a></b></td>
									<td style='padding: 8px;'>- This code file defines API routes for managing menu items within the applications backend architecture<br>- Its primary purpose is to facilitate the creation of new menu entries, including uploading associated images and specifying ingredients, in a single, streamlined request<br>- By integrating role-based access control, it ensures that only authorized users such as Owners, General Managers, or Store Managers can perform these operations<br>- Overall, this module plays a crucial role in enabling dynamic menu management, supporting the broader systems functionality for inventory and content updates in a secure and efficient manner.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/auth_routes.py'>auth_routes.py</a></b></td>
									<td style='padding: 8px;'>- Defines authentication endpoints for user login, session validation, and logout, integrating Supabase for user management and activity logging<br>- Facilitates secure token validation, user data retrieval, and activity tracking, ensuring seamless user authentication flow within the applications architecture<br>- Enhances security, user experience, and auditability across the systems authentication processes.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/automaticbackup.py'>automaticbackup.py</a></b></td>
									<td style='padding: 8px;'>- Implements automated backup scheduling for the application, enabling users to configure regular database backups at specified intervals and times<br>- Facilitates local database dumps and uploads to Google Drive, ensuring data safety and recovery<br>- Integrates with FastAPI endpoints for schedule management and employs background job scheduling to execute backups seamlessly within the overall system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory.py'>inventory.py</a></b></td>
									<td style='padding: 8px;'>- Inventory Management APIThis module provides core endpoints for managing and monitoring inventory items within the application<br>- It enables retrieval and updating of stock levels, ensuring real-time visibility into inventory status<br>- The code facilitates dynamic stock threshold configurations, allowing the system to categorize inventory health (e.g., Out Of Stock", Critical, Low, Normal) based on current quantities and customizable thresholds<br>- Overall, it plays a vital role in maintaining accurate inventory tracking, supporting operational decision-making, and ensuring stock levels are proactively managed across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_settings.py'>inventory_settings.py</a></b></td>
									<td style='padding: 8px;'>- Defines API endpoints for managing inventory settings, enabling retrieval, creation, updating, and deletion within the applications backend<br>- Integrates role-based access control and logs user activities for audit purposes, ensuring consistent inventory configuration management aligned with user permissions across the system architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/supplier.py'>supplier.py</a></b></td>
									<td style='padding: 8px;'>- Manages supplier data operations within the backend architecture, enabling creation, retrieval, updating, and deletion of supplier records<br>- Integrates role-based access control and activity logging to ensure secure, auditable interactions<br>- Serves as a core component for maintaining supplier information, supporting supply chain management, and facilitating administrative oversight across the system.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/inventory_log.py'>inventory_log.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates recording and retrieving inventory log entries within the applications backend<br>- Supports bulk insertion of stock updates, capturing details like item ID, stock levels, action date, user, status, and wastage<br>- Enables querying logs filtered by date ranges, ensuring accurate inventory tracking and historical analysis aligned with the overall data architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/notification.py'>notification.py</a></b></td>
									<td style='padding: 8px;'>- Manages user notifications and alert settings within the application, enabling retrieval, updates, and creation of notifications related to inventory status, low stock, and expiration alerts<br>- Integrates with user activity logging and enforces role-based access, supporting proactive communication to users about inventory conditions and system events across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/dashboard.py'>dashboard.py</a></b></td>
									<td style='padding: 8px;'>- Provides API endpoints for dashboard metrics, including low stock inventory, expiring ingredients within a configurable timeframe, and surplus ingredients<br>- Facilitates real-time inventory monitoring and alerts, supporting inventory management and decision-making processes within the broader application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_report.py'>sales_report.py</a></b></td>
									<td style='padding: 8px;'>- Provides comprehensive API endpoints for generating detailed sales analytics, including summaries, item breakdowns, temporal trends, top performers, hourly data, and period comparisons<br>- Facilitates data-driven decision-making by aggregating and analyzing sales data from the database, supporting various reporting needs within the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/backup_restore.py'>backup_restore.py</a></b></td>
									<td style='padding: 8px;'>- This code file defines the core backend routes responsible for managing data backup and restoration processes within the application<br>- It facilitates comprehensive data management by enabling users to back up critical database tables and restore data as needed<br>- Additionally, it integrates with Google Drive to securely store backups, ensuring data persistence and recoverability<br>- Overall, this module plays a pivotal role in maintaining data integrity, supporting disaster recovery, and enabling seamless data migration across the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/sales_prediction.py'>sales_prediction.py</a></b></td>
									<td style='padding: 8px;'>- Provides an API endpoint for forecasting top-selling items based on recent sales data<br>- It aggregates sales over a specified period, identifies leading products, and generates short-term sales predictions using Prophet<br>- This functionality supports inventory planning and demand forecasting within the overall sales analytics architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/routes/resetpass.py'>resetpass.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates password reset requests by providing an API endpoint that triggers email notifications with reset links<br>- Integrates email delivery via SMTP, enabling users to securely initiate password recovery<br>- Serves as a critical component within the authentication flow, ensuring seamless user account management and enhancing overall security within the application architecture.</td>
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
									<td style='padding: 8px;'>- Defines the foundational ORM model class for the applications database layer, establishing a common base for all database models within the backend architecture<br>- Facilitates consistent mapping of Python classes to database tables, enabling seamless data persistence and retrieval across the entire codebase<br>- Serves as the core component for ORM interactions in the backends data management system.</td>
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
									<td style='padding: 8px;'>- Facilitates user authentication by interfacing with Supabases authentication API, enabling secure login functionality within the backend service<br>- Integrates environment variables for configuration, manages asynchronous HTTP requests, and handles credential validation, forming a core component of the applications user management and access control architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/user_activity_log_service.py'>user_activity_log_service.py</a></b></td>
									<td style='padding: 8px;'>- Facilitates logging and retrieval of user activity data within the application, supporting audit trails and user behavior analysis<br>- Provides mechanisms to record user actions with contextual details and query logs based on various filters such as user ID, action type, role, and date ranges<br>- Integrates seamlessly into the overall architecture to ensure comprehensive activity tracking and reporting.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/AcsOfficial/Capstone-Project/blob/master/backend/app/services/example_service.py'>example_service.py</a></b></td>
									<td style='padding: 8px;'>- Provides an asynchronous service function that retrieves example data within the backend architecture, facilitating data fetching operations for the application<br>- It supports the overall system by enabling efficient, non-blocking access to sample information, which can be integrated into larger workflows or API responses to demonstrate or test core functionalities of the FastAPI-based backend.</td>
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
									<td style='padding: 8px;'>- Implements role-based access control (RBAC) by authenticating users through JWT tokens and verifying their roles against database records<br>- Facilitates secure authorization for API endpoints within the backend architecture, ensuring that only users with appropriate permissions can access protected resources<br>- Integrates seamlessly with FastAPIs dependency injection system to enforce security policies across the application.</td>
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
					<td style='padding: 8px;'>- Defines the database schema for managing core entities such as users, inventory, orders, menus, ingredients, food trends, and backup history<br>- Facilitates data organization, relationships, and constraints essential for supporting restaurant operations, inventory tracking, trend analysis, and user activity logging within the overall system architecture<br>- Ensures data integrity and streamlined interactions across various modules.</td>
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
