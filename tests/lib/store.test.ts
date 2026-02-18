import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  loadPatients,
  savePatients,
  getActivePatientId,
  setActivePatientId,
  loadHistory,
  saveHistory,
  addVisit,
  LabVisit,
} from '@/lib/store'
import { demoPatients, PatientProfile } from '@/lib/ncd-cie-engine'

describe('store - localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('loadPatients', () => {
    it('should return demoPatients when localStorage is empty', () => {
      const patients = loadPatients()
      expect(patients).toEqual(demoPatients)
    })

    it('should return stored patients when localStorage has data', () => {
      const customPatients: PatientProfile[] = [
        {
          id: 'test-1',
          name: 'Test Patient',
          age: 45,
          sex: 'male',
          ldl: 120,
          hdl: 50,
          tc: 200,
          tg: 150,
          sbp: 130,
          dbp: 85,
          hba1c: 5.5,
          fpg: 100,
          egfr: 90,
          bmi: 25,
          smoking: 0,
          exercise: 3,
          alcohol: 1,
          diet: 0.5,
          statin: 0,
          htn_med: 0,
          sglt2i: 0,
          metformin: 0,
          aspirin: 0,
          ace_arb: 0,
          diabetes: 0,
          hypertension: 0,
        },
      ]
      localStorage.setItem('ncd-care-plus-patients', JSON.stringify(customPatients))

      const patients = loadPatients()
      expect(patients).toEqual(customPatients)
    })

    it('should return demoPatients on JSON parse error', () => {
      localStorage.setItem('ncd-care-plus-patients', 'invalid-json')
      const patients = loadPatients()
      expect(patients).toEqual(demoPatients)
    })
  })

  describe('savePatients', () => {
    it('should save patients to localStorage', () => {
      const patients: PatientProfile[] = [...demoPatients]
      savePatients(patients)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-patients',
        JSON.stringify(patients)
      )
    })

    it('should handle empty array', () => {
      savePatients([])
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-patients',
        '[]'
      )
    })
  })

  describe('getActivePatientId', () => {
    it('should return default id when localStorage is empty', () => {
      const id = getActivePatientId()
      expect(id).toBe('demo-moderate')
    })

    it('should return stored id when present', () => {
      localStorage.setItem('ncd-care-plus-active', 'custom-patient-id')
      const id = getActivePatientId()
      expect(id).toBe('custom-patient-id')
    })
  })

  describe('setActivePatientId', () => {
    it('should save active patient id to localStorage', () => {
      setActivePatientId('test-patient-123')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-active',
        'test-patient-123'
      )
    })

    it('should handle empty string id', () => {
      setActivePatientId('')
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-active',
        ''
      )
    })
  })

  describe('loadHistory', () => {
    it('should return empty array when no history exists', () => {
      const history = loadHistory('patient-1')
      expect(history).toEqual([])
    })

    it('should return stored history for patient', () => {
      const visits: LabVisit[] = [
        {
          date: '2024-01-15',
          profile: demoPatients[0],
        },
        {
          date: '2024-02-20',
          profile: demoPatients[0],
        },
      ]
      localStorage.setItem('ncd-care-plus-history-patient-1', JSON.stringify(visits))

      const history = loadHistory('patient-1')
      expect(history).toEqual(visits)
    })

    it('should return empty array on JSON parse error', () => {
      localStorage.setItem('ncd-care-plus-history-patient-1', 'invalid-json')
      const history = loadHistory('patient-1')
      expect(history).toEqual([])
    })

    it('should isolate history per patient', () => {
      const visits1: LabVisit[] = [{ date: '2024-01-01', profile: demoPatients[0] }]
      const visits2: LabVisit[] = [{ date: '2024-02-01', profile: demoPatients[1] }]

      localStorage.setItem('ncd-care-plus-history-patient-1', JSON.stringify(visits1))
      localStorage.setItem('ncd-care-plus-history-patient-2', JSON.stringify(visits2))

      expect(loadHistory('patient-1')).toEqual(visits1)
      expect(loadHistory('patient-2')).toEqual(visits2)
    })
  })

  describe('saveHistory', () => {
    it('should save history to localStorage with correct key', () => {
      const visits: LabVisit[] = [
        { date: '2024-01-15', profile: demoPatients[0] },
      ]

      saveHistory('patient-abc', visits)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-history-patient-abc',
        JSON.stringify(visits)
      )
    })

    it('should handle empty history array', () => {
      saveHistory('patient-1', [])
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'ncd-care-plus-history-patient-1',
        '[]'
      )
    })
  })

  describe('addVisit', () => {
    it('should add a new visit to empty history', () => {
      const profile = demoPatients[0]

      addVisit('patient-new', profile)

      // Check that saveHistory was called (via localStorage.setItem)
      expect(localStorage.setItem).toHaveBeenCalled()
      const call = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        c => c[0] === 'ncd-care-plus-history-patient-new'
      )
      expect(call).toBeDefined()

      const savedHistory = JSON.parse(call![1]) as LabVisit[]
      expect(savedHistory).toHaveLength(1)
      expect(savedHistory[0].profile).toEqual(profile)
      expect(savedHistory[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should append visit to existing history', () => {
      const existingVisit: LabVisit = {
        date: '2024-01-01',
        profile: demoPatients[0],
      }
      localStorage.setItem(
        'ncd-care-plus-history-patient-existing',
        JSON.stringify([existingVisit])
      )
      vi.clearAllMocks()

      addVisit('patient-existing', demoPatients[1])

      const call = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        c => c[0] === 'ncd-care-plus-history-patient-existing'
      )
      const savedHistory = JSON.parse(call![1]) as LabVisit[]
      expect(savedHistory).toHaveLength(2)
      expect(savedHistory[0]).toEqual(existingVisit)
      expect(savedHistory[1].profile).toEqual(demoPatients[1])
    })

    it('should use current date in ISO format', () => {
      const mockDate = new Date('2024-06-15T10:30:00Z')
      vi.setSystemTime(mockDate)

      addVisit('patient-date-test', demoPatients[0])

      const call = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
        c => c[0] === 'ncd-care-plus-history-patient-date-test'
      )
      const savedHistory = JSON.parse(call![1]) as LabVisit[]
      expect(savedHistory[0].date).toBe('2024-06-15')

      vi.useRealTimers()
    })
  })
})
