# Fuel Expense Control System

A comprehensive fuel expense tracking and management system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **User Authentication**: Secure user management and authentication
- **Area Management**: Organize expenses by main areas and sub-areas
- **Card Management**: Track fuel cards and their assignments
- **Fuel Log Tracking**: Comprehensive fuel expense logging with Excel import support
- **Professional Dashboard**: Real-time statistics and insights
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React
- **Excel Processing**: xlsx library
- **Utility Classes**: clsx for conditional styling

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fuel-expense-control
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your database connection in `.env`:
```
DATABASE_URL="postgresql://username:password@localhost:5432/fuel_expense_control"
```

5. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The system uses the following main entities:

- **Users**: Authentication and user management
- **MainAreas**: Top-level organizational areas
- **SubAreas**: Sub-areas within main areas
- **Cards**: Fuel cards with area assignments
- **FuelLogs**: Detailed fuel expense records

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/
│   ├── layout/         # Layout components (Sidebar, MainLayout)
│   └── ui/             # Reusable UI components
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── prisma/             # Database schema and migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
