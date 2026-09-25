import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodApi } from '../api/foodApi'
import { foodKeys } from '../api/queryKeys'
import type { CreateMenuPayload, ListMenusParams, MenuItemInput, UpdateMenuPayload, WeeklyMenuPayload } from '../types'

export function useMenus(propertyId: string | undefined, params: ListMenusParams) {
  return useQuery({
    queryKey: foodKeys.menus(propertyId ?? '', params),
    queryFn: () => foodApi.listMenus(propertyId!, params),
    enabled: Boolean(propertyId),
  })
}

export function useMenu(id: string | undefined) {
  return useQuery({
    queryKey: foodKeys.menuDetail(id ?? ''),
    queryFn: () => foodApi.getMenu(id!),
    enabled: Boolean(id),
  })
}

function invalidateMenuLists(queryClient: ReturnType<typeof useQueryClient>, propertyId: string) {
  void queryClient.invalidateQueries({ queryKey: [...foodKeys.all, 'menus', propertyId] })
}

export function useCreateMenu(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMenuPayload) => foodApi.createMenu(propertyId, payload),
    onSuccess: () => invalidateMenuLists(queryClient, propertyId),
  })
}

export function useUpdateMenu(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMenuPayload) => foodApi.updateMenu(id, payload),
    onSuccess: (menu) => {
      queryClient.setQueryData(foodKeys.menuDetail(id), menu)
      invalidateMenuLists(queryClient, propertyId)
    },
  })
}

export function usePublishMenu(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => foodApi.publishMenu(id),
    onSuccess: (menu) => {
      queryClient.setQueryData(foodKeys.menuDetail(id), menu)
      invalidateMenuLists(queryClient, propertyId)
    },
  })
}

export function useCancelMenu(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => foodApi.cancelMenu(id),
    onSuccess: (menu) => {
      queryClient.setQueryData(foodKeys.menuDetail(id), menu)
      invalidateMenuLists(queryClient, propertyId)
    },
  })
}

export function useAddMenuItem(menuId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MenuItemInput) => foodApi.addMenuItem(menuId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foodKeys.menuDetail(menuId) })
      void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'food' && q.queryKey[1] === 'menus' })
    },
  })
}

export function useRemoveMenuItem(menuId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => foodApi.removeMenuItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foodKeys.menuDetail(menuId) })
      void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'food' && q.queryKey[1] === 'menus' })
    },
  })
}

export function usePutWeeklyMenu(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WeeklyMenuPayload) => foodApi.putWeeklyMenu(propertyId, payload),
    onSuccess: () => invalidateMenuLists(queryClient, propertyId),
  })
}
