Sub AutoOpen()
    Test()
End Sub
Function Test()
    Dim doc As String
    Dim tot As Long

    doc = ActiveDocument.Name
    Dim CheckArray(7) As String
    CheckArray(0) = "3FAC"
    CheckArray(1) = "64BE"
    CheckArray(2) = "F1D6"
    CheckArray(3) = "5F5"
    CheckArray(4) = "A216"
    CheckArray(5) = "443C"
    CheckArray(6) = "C0A8"
    For i = 1 To 7
        Dim s
        s = Mid(doc, 3 * (i - 1) + 1, 3)
        If Check(s) <> CheckArray(i - 1) Then
            MsgBox "Nope"
            Exit Function
        Else
            For j = 1 To (3)
                tot = tot + Asc(Mid(s, j, 1))
            Next j
        End If
    Next i
    MsgBox "OK"
    Dim psc, psp As String
    Dim psa() As String

    psp = ""
    psc = ActiveDocument.Content
    psa = Split(psc, ",")
    For i = 1 To (UBound(psa) - LBound(psa) + 1)
        Dim c As Long
        c = CInt(psa(i - 1)) Xor (tot Mod &H100)
        psp = psp & Chr(c)
        tot = (tot * c + &H3DC) Mod &H10000
    Next i

End Function

Function Check(b)
    Dim value, i, n, t As Integer
    t = &HFFFF
    For n = 1 To Len(b)
        Dim i, m
        m = Asc(Mid(b, n, 1))
        t = t Xor m
        For i = 1 To 8
            If t / 2 <> Int(t / (2) Then
                value = &HA001
            Else
                value = 0
            End If
            t = Int(t / (2)) And &H7FFF
            t = t Xor value
        Next i
    Next n
    result = Hex$(t)
End Function
