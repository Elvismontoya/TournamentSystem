import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout.tsx';
import { TournamentLayout } from './layouts/TournamentLayout.tsx';
import { TournamentsPage } from './pages/admin/TournamentsPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { BracketHalfPage } from './pages/print/BracketHalfPage.tsx';
import { GroupSheetPage } from './pages/print/GroupSheetPage.tsx';
import { MatchSheetPage } from './pages/print/MatchSheetPage.tsx';
import { PrintLayout } from './pages/print/PrintLayout.tsx';
import { BracketsPage } from './pages/tournament/BracketsPage.tsx';
import { GroupsPage } from './pages/tournament/GroupsPage.tsx';
import { MatchesPage } from './pages/tournament/MatchesPage.tsx';
import { OverviewPage } from './pages/tournament/OverviewPage.tsx';
import { ParticipantsPage } from './pages/tournament/ParticipantsPage.tsx';
import { RankingPage } from './pages/tournament/RankingPage.tsx';
import { SettingsPage } from './pages/tournament/SettingsPage.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'mis-torneos', element: <TournamentsPage /> },
      {
        // Tournament dashboard: where everything about one tournament is managed
        path: 'torneos/:slug',
        element: <TournamentLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'participantes', element: <ParticipantsPage /> },
          { path: 'partidos', element: <MatchesPage /> },
          { path: 'grupos', element: <GroupsPage /> },
          { path: 'llaves', element: <BracketsPage /> },
          { path: 'clasificacion', element: <RankingPage /> },
          { path: 'configuracion', element: <SettingsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    // Print pages (planillas and bracket), opened in a new tab: no app layout around them.
    path: '/torneos/:slug/imprimir',
    element: <PrintLayout />,
    children: [
      { path: 'grupo/:groupIndex', element: <GroupSheetPage /> },
      { path: 'partido/:round/:matchIndex', element: <MatchSheetPage /> },
      { path: 'llaves/:half', element: <BracketHalfPage /> },
    ],
  },
]);
