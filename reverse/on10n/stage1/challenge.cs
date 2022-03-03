private void MainWindow_Loaded(object sender, RoutedEventArgs e)
{
	IPAddress[] hostAddresses = Dns.GetHostAddresses(Dns.GetHostName());
	uint seed = 0u;
	bool flag = false;
	IPAddress[] array = hostAddresses;
	foreach (IPAddress iPAddress in array)
	{
		if (iPAddress.AddressFamily != AddressFamily.InterNetwork)
		{
			continue;
		}
		uint num = BitConverter.ToUInt32(iPAddress.GetAddressBytes(), 0);
		uint num2 = num;
		List<uint> list = new List<uint>();
		List<uint> list2 = new List<uint>();
		uint num3 = 2u;
		while (num > 1)
		{
			if (num % num3 == 0)
			{
				uint num4 = 0u;
				while (num % num3 == 0)
				{
					num /= num3;
					num4++;
				}
				list.Add(num3);
				list2.Add(num4);
			}
			num3++;
		}
		if (sameFactor(list, list2))
		{
			seed = num2;
			flag = true;
			break;
		}
	}
	if (flag)
	{
		MessageBox.Show("OK", "on10n", MessageBoxButton.OK);
		Random random = new Random((int)seed);
		byte[] nantouPoliceOfficeBureau = on10n.Properties.Resources.NantouPoliceOfficeBureau;
		byte[] array2 = new byte[124814];
		for (int j = 0; j < 124814; j++)
		{
			array2[j] = (byte)random.Next(0, 256);
			array2[j] ^= nantouPoliceOfficeBureau[j];
		}
	}
	else
	{
		MessageBox.Show("Nope", "on10n", MessageBoxButton.OK);
	}
}

private bool sameFactor(List<uint> factors, List<uint> exponents)
{
	uint[] array = new uint[4] { 2u, 5u, 3371u, 30347u };
	uint[] array2 = new uint[4] { 1u, 1u, 1u, 1u };
	if (factors.Count != 4 || exponents.Count != 4)
	{
		return false;
	}
	for (int i = 0; i < 4; i++)
	{
		if (factors[i] != array[i] || exponents[i] != array2[i])
		{
			return false;
		}
	}
	return true;
}
