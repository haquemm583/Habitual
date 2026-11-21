/*
  milestones.js

  This script has the API routes for all milestone endpoints

  Created by: CJ Quintero
  Created on: 11/18/2026
*/

import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const NAME_MAX_LENGTH = 200
const DESCRIPTION_MAX_LENGTH = 2000

/*
  columns returned for every milestone, named in camelCase like the tasks API.

  the DATE columns are cast to text on purpose: the pg driver would otherwise turn
  them into JS Dates, which get shifted by the server's timezone when they are
  converted to JSON. as text they always come back as plain YYYY-MM-DD strings.
*/
const MILESTONE_COLUMNS = `
  id,
  name,
  description,
  target_date::text AS "targetDate",
  completed_on::text AS "completedOn",
  created_at AS "createdAt"
`

function parseMilestoneId(rawId) {
  /*
    helper function to extract the milestone id
  */

  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  return id
}

function isValidDateString(value) {
  /*
    checks that a value is a real calendar date written as YYYY-MM-DD
    (so 2026-02-30 is rejected)
  */

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  // building the date rolls invalid days over (Feb 30 -> Mar 2), so the
  // parts only match what was typed when the date is real
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function validateName(name) {
  /* returns an error message if the name is invalid, otherwise null */

  if (typeof name !== 'string' || !name.trim() || name.trim().length > NAME_MAX_LENGTH) {
    return `Milestone name must contain 1 to ${NAME_MAX_LENGTH} characters.`
  }
  return null
}

function validateDescription(description) {
  /* the description has to be a string or null (undefined is handled by the caller) */

  if (description !== null && typeof description !== 'string') {
    return 'Description must be a string.'
  }
  if (typeof description === 'string' && description.trim().length > DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
  }
  return null
}

function validateDate(value, label) {
  /* a date has to be a valid YYYY-MM-DD string or null (undefined is handled by the caller) */

  if (value !== null && !isValidDateString(value)) {
    return `${label} must be YYYY-MM-DD.`
  }
  return null
}


router.use((req, res, next) => {
  /* this middleware checks the request origin and if the user is logged in */

  // tell browser not to cache anything
  res.set('Cache-Control', 'no-store')

  /*
    block the origin if it is not a GET request, and contains an Origin header,
    and isn't in the allowedOrigins list.
  */
  const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:9000', 'http://localhost:3000']
  if (req.method !== 'GET' && req.get('Origin') && !allowedOrigins.includes(req.get('Origin'))) {
    return res.status(403).json({ error: 'Request origin is not allowed.' })
  }

  // check that the user is logged in by checking for their UID
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Login required.' })
  }

  next()
})


// GET /api/milestones - list all milestones for the logged-in user
router.get('/', async (req, res, next) => {
  /*
    gets all milestones for the current user.
    this orders the milestones by closest deadlines first
    that haven't been completed, with the milestones with no
    target date listed last at the bottom
  */

  try {
    const result = await pool.query(
      `
      SELECT ${MILESTONE_COLUMNS}
      FROM milestones
      WHERE user_id = $1
      ORDER BY completed_on IS NOT NULL, target_date ASC NULLS LAST, id ASC
      `,
      [req.session.userId],
    )

    return res.json(result.rows)
  } catch (error) {
    next(error)
  }
})


// GET /api/milestones/:id - get one milestone owned by the logged-in user
router.get('/:id', async (req, res, next) => {
  /*
    get specific milestone by id
  */

  // get the id
  const milestoneId = parseMilestoneId(req.params.id)
  if (!milestoneId) {
    return res.status(400).json({ error: 'Invalid milestone ID.' })
  }

  try {
    const result = await pool.query(
      `
      SELECT ${MILESTONE_COLUMNS}
      FROM milestones
      WHERE id = $1
      AND user_id = $2
      `,
      [milestoneId, req.session.userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Milestone not found.' })
    }

    return res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})


// POST /api/milestones - create a milestone for the logged-in user
router.post('/', async (req, res, next) => {
  /*
    creates a new milestone if valid or gives an error
    on bad input
  */

  const { name, description, targetDate } = req.body ?? {}

  // the name is required. the description and target date are optional
  const error =
    validateName(name) ??
    validateDescription(description ?? null) ??
    validateDate(targetDate ?? null, 'Target date')
  if (error) {
    return res.status(400).json({ error })
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO milestones
      (user_id, name, description, target_date)
      VALUES ($1, $2, $3, $4)
      RETURNING ${MILESTONE_COLUMNS}
      `,
      [
        req.session.userId,
        name.trim(),
        description?.trim() || null,
        targetDate ?? null,
      ],
    )

    return res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
})


// PATCH /api/milestones/:id - update a milestone owned by the logged-in user
router.patch('/:id', async (req, res, next) => {
  /*
    updates any of: name, description, targetDate, completedOn

    only the fields that are sent are changed. null clears
    description, targetDate, and completedOn. completedOn is the date
    the milestone was finished (YYYY-MM-DD), sending null marks it
    as not completed again. the client sends the date so that it uses
    the user's own timezone instead of the database server's.
  */

  const milestoneId = parseMilestoneId(req.params.id)
  if (!milestoneId) {
    return res.status(400).json({ error: 'Invalid milestone ID.' })
  }

  const { name, description, targetDate, completedOn } = req.body ?? {}

  if ([name, description, targetDate, completedOn].every((value) => value === undefined)) {
    return res.status(400).json({
      error: 'Provide a name, description, target date, or completed date to update.',
    })
  }

  // only validate the fields that were sent
  const error =
    (name !== undefined ? validateName(name) : null) ??
    (description !== undefined ? validateDescription(description) : null) ??
    (targetDate !== undefined ? validateDate(targetDate, 'Target date') : null) ??
    (completedOn !== undefined ? validateDate(completedOn, 'Completed date') : null)
  if (error) {
    return res.status(400).json({ error })
  }

  // build the SET clause from only the fields that were sent
  const updates = []
  const values = []
  function setField(column, value) {
    values.push(value)
    updates.push(`${column} = $${values.length}`)
  }

  if (name !== undefined) setField('name', name.trim())
  if (description !== undefined) setField('description', description?.trim() || null)
  if (targetDate !== undefined) setField('target_date', targetDate)
  if (completedOn !== undefined) setField('completed_on', completedOn)

  // the ownership check is part of the WHERE so one user can't edit another's milestone
  values.push(milestoneId, req.session.userId)

  try {
    const result = await pool.query(
      `
      UPDATE milestones
      SET ${updates.join(', ')}
      WHERE id = $${values.length - 1}
      AND user_id = $${values.length}
      RETURNING ${MILESTONE_COLUMNS}
      `,
      values,
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Milestone not found.' })
    }

    return res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})


// DELETE /api/milestones/:id - delete a milestone owned by the logged-in user
router.delete('/:id', async (req, res, next) => {
  /*
    Deletes a milestone. Linked tasks and recurring habits are kept and
    become unassigned when their foreign keys set milestone_id to NULL.
  */

  const milestoneId = parseMilestoneId(req.params.id)
  if (!milestoneId) {
    return res.status(400).json({ error: 'Invalid milestone ID.' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM milestones WHERE id = $1 AND user_id = $2',
      [milestoneId, req.session.userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Milestone not found.' })
    }

    return res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

export default router
