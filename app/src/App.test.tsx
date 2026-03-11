import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { hydrateSeedData } from '@/data/seed'

describe('QA Checklist - App Shell', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Load seed data for consistent test state
    hydrateSeedData()
  })

  it('loads with Dashboard as the default view', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('shows four nav items in sidebar', () => {
    render(<App />)
    const nav = screen.getByRole('navigation')
    expect(within(nav).getByText('Dashboard')).toBeInTheDocument()
    expect(within(nav).getByText('Projects')).toBeInTheDocument()
    expect(within(nav).getByText('Team')).toBeInTheDocument()
    expect(within(nav).getByText('Capacity')).toBeInTheDocument()
  })

  it('highlights active nav item with aria-current', () => {
    render(<App />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  })

  it('navigates to Projects view when clicking Projects nav item', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const projectsLink = screen.getByRole('link', { name: /projects/i })
    await user.click(projectsLink)
    
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(projectsLink).toHaveAttribute('aria-current', 'page')
  })

  it('navigates to Team view when clicking Team nav item', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const teamLink = screen.getByRole('link', { name: /team/i })
    await user.click(teamLink)
    
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument()
    expect(teamLink).toHaveAttribute('aria-current', 'page')
  })

  it('navigates to Capacity view when clicking Capacity nav item', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const capacityLink = screen.getByRole('link', { name: /capacity/i })
    await user.click(capacityLink)
    
    expect(screen.getByRole('heading', { name: 'Capacity' })).toBeInTheDocument()
    expect(capacityLink).toHaveAttribute('aria-current', 'page')
  })

  it('updates header title to match active view', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    
    await user.click(screen.getByRole('link', { name: /projects/i }))
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    
    await user.click(screen.getByRole('link', { name: /team/i }))
    expect(screen.getByRole('heading', { name: 'Team' })).toBeInTheDocument()
    
    await user.click(screen.getByRole('link', { name: /capacity/i }))
    expect(screen.getByRole('heading', { name: 'Capacity' })).toBeInTheDocument()
  })

  it('shows User Switcher in header', () => {
    render(<App />)
    // User switcher should show current user name and role badge
    expect(screen.getByLabelText(/switch active user/i)).toBeInTheDocument()
  })

  it('allows keyboard navigation through sidebar links', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Tab to first link
    await user.tab()
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveFocus()
    
    // Tab to next link
    await user.tab()
    const projectsLink = screen.getByRole('link', { name: /projects/i })
    expect(projectsLink).toHaveFocus()
    
    // Press Enter to activate
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
  })
})
